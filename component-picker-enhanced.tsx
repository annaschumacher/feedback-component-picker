import React, { useState, useMemo } from "react";
import { ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";

const Chip = ({ selected, onClick, children, variant = "default" }) => (
  <button
    onClick={onClick}
    className={[
      "px-3 py-1.5 rounded-full text-sm border transition cursor-pointer font-medium",
      variant === "filter" && selected
        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
        : variant === "filter" && !selected
        ? "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        : selected
        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
        : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
    ].join(" ")}
  >
    {children}
  </button>
);

const SEVERITIES = [
  { name: "Critical", description: "High impact, blocks users from continuing" },
  { name: "Major", description: "Significant impact, user can work around" },
  { name: "Minor", description: "Low impact, doesn't block core functionality" },
  { name: "Informational", description: "Helpful context, no action needed" }
];

const TYPES = [
  { name: "Indicator", description: "Shows current state passively" },
  { name: "Validation", description: "Responds to user input errors" },
  { name: "Notification", description: "Proactive messages to alert users" }
];

const REGISTRY = {
  "UI State": {
    description: "This component displays to communicate a full-page empty, loading or error state.",
    when: ["Full page errors", "Critical flows blocked", "Nothing to display due to error or empty state"],
    why: "Use when the entire screen needs to shift into an error or empty mode, keeping users oriented when no content can be shown.",
    scopes: ["Page", "Section"],
    link: "/docs/components/ui-state",
    tags: ["full-page", "blocking", "critical"]
  },
  Dialog: {
    description: "Dialogs interrupt the user journey to communicate information considered most critical.",
    when: ["Critical confirmations", "Destructive actions", "Permission or security issues"],
    why: "Best for critical issues that must be acknowledged before the user can continue their workflow.",
    scopes: ["Global", "Page"],
    link: "/docs/components/dialog",
    tags: ["modal", "blocking", "critical", "confirmation"]
  },
  "Inline field error": {
    description: "Validation occurs after the user has finished interacting with the field to avoid disrupting input. If there's an error, we show an error message.",
    when: ["Required field missing", "Invalid input format", "Validation after submit or blur"],
    why: "Keeps feedback close to the problem so users can correct errors immediately without losing context.",
    scopes: ["Inline"],
    link: "/docs/components/field-error",
    tags: ["form", "validation", "contextual", "inline"]
  },
  Alert: {
    description: "The Alert is a messaging component designed to alert users about important information, ensuring they can complete tasks with ease.",
    when: ["Recoverable issues", "Section-level errors", "Important but non-blocking updates"],
    why: "Visible without blocking progress, ensuring users see and act on important information while maintaining workflow continuity.",
    scopes: ["Global", "Section"],
    link: "/docs/components/alert",
    tags: ["banner", "prominent", "non-blocking"]
  },
  "Status light": {
    description: "Status light is used to indicate the status of something. Such as if an item has high or low stock. Status light is non interactive.",
    when: ["Stock level indicators", "System status", "Minor or informational signals"],
    why: "Provides quick, at-a-glance status without demanding user action or interrupting their current task.",
    scopes: ["Inline"],
    link: "/docs/components/status-light",
    tags: ["indicator", "status", "passive", "visual"]
  },
  Toast: {
    description: "A toast notification is best used for brief, non-intrusive messages that inform about app processes or provide feedback to the user without requiring immediate interaction.",
    when: ["Quick success or error feedback", "Background process updates", "Non-blocking confirmations"],
    why: "Lightweight feedback that reassures users without interrupting their flow or requiring acknowledgment.",
    scopes: ["Global"],
    link: "/docs/components/toast",
    tags: ["temporary", "auto-dismiss", "feedback", "non-intrusive"]
  },
  "Helper text": {
    description: "Inline guidance that prevents errors before they happen.",
    when: ["Field instructions", "Password or input rules", "Contextual tips before typing"],
    why: "Reduces mistakes by clarifying expectations before users act, improving form completion success rates.",
    scopes: ["Inline"],
    link: "/docs/components/helper-text",
    tags: ["guidance", "proactive", "form", "preventive"]
  },
  Tooltip: {
    description: "Tooltips display additional information that is contextual, helpful, and nonessential while providing the ability to communicate and give clarity to a user.",
    when: ["Explain icon meaning", "Provide nonessential context", "On-hover details"],
    why: "Good for clarifying controls or icons without adding visual noise to the interface.",
    scopes: ["Inline"],
    link: "/docs/components/tooltip",
    tags: ["on-demand", "hover", "contextual", "supplementary"]
  },
  Icon: {
    description: "Decorative or semantic icon to signal state alongside text.",
    when: ["Reinforce message with symbol", "Use with labels to clarify meaning", "Show status without relying on color only"],
    why: "Supports clarity and accessibility when paired with text, enhances visual hierarchy and comprehension.",
    scopes: ["Inline"],
    link: "/docs/components/icon",
    tags: ["visual", "reinforcement", "accessibility", "symbolic"]
  }
};

const MATRIX = {
  Critical: {
    Indicator: [],
    Validation: [],
    Notification: ["UI State", "Dialog"]
  },
  Major: {
    Indicator: [],
    Validation: ["Inline field error"],
    Notification: ["Alert"]
  },
  Minor: {
    Indicator: ["Status light"],
    Validation: [],
    Notification: ["Toast", "Alert"]
  },
  Informational: {
    Indicator: ["Status light", "Helper text", "Tooltip", "Icon"],
    Validation: [],
    Notification: ["Toast", "Alert"]
  }
};

const FILTERS = [
  {
    question: "Who triggers the message?",
    description: "Is this a response to something the user did, or does the system initiate it?",
    options: ["User action", "System event", "Either"],
    mapping: { Indicator: "Either", Validation: "User action", Notification: "System event" }
  },
  {
    question: "Where should it appear?",
    description: "Think about the scope and positioning of the message",
    options: ["Near the problem", "Page level", "Flexible"],
    mapping: { Indicator: "Near the problem", Validation: "Near the problem", Notification: "Page level" }
  },
  {
    question: "Does it require user action?",
    description: "Do users need to do something after seeing this message?",
    options: ["Just informative", "Needs response", "Depends"],
    mapping: { Indicator: "Just informative", Validation: "Needs response", Notification: "Depends" }
  }
];

export default function ComponentPicker() {
  const [severity, setSeverity] = useState(null);
  const [msgType, setMsgType] = useState(null);
  const [filterAnswers, setFilterAnswers] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const { matches, mismatches } = useMemo(() => {
    if (!severity || !msgType) return { matches: [], mismatches: [] };

    const items = MATRIX[severity][msgType];
    const matches = [];
    const mismatches = [];

    items.forEach((name) => {
      let score = 100;
      let reasons = [];
      let filtersApplied = 0;
      let filterMatches = 0;
      
      FILTERS.forEach((f) => {
        if (filterAnswers[f.question]) {
          filtersApplied++;
          const expected = f.mapping[msgType];
          const userAnswer = filterAnswers[f.question];
          
          if (expected && expected !== "Either" && expected !== "Depends" && expected !== "Flexible") {
            if (userAnswer === expected) {
              filterMatches++;
            } else {
              const explanations = {
                "Who triggers the message?": {
                  "User action": "because validation typically responds to what users do",
                  "System event": "because notifications are usually system-initiated",
                  "Either": "because indicators can be triggered by both user actions and system events"
                },
                "Where should it appear?": {
                  "Near the problem": "because validation and indicators work best when placed contextually",
                  "Page level": "because notifications need broader visibility",
                  "Flexible": "because placement can vary based on context"
                },
                "Does it require user action?": {
                  "Just informative": "because indicators typically don't require user response",
                  "Needs response": "because validation errors need to be addressed",
                  "Depends": "because notifications can be either informational or actionable"
                }
              };
              const explanation = explanations[f.question] && explanations[f.question][expected] 
                ? explanations[f.question][expected] 
                : "";
              reasons.push(`Expected "${expected}" for "${f.question}" ${explanation}`);
            }
          } else {
            // For flexible options (Either, Depends, Flexible), count as a match
            filterMatches++;
          }
        }
      });
      
      // Calculate score based on filter matches
      if (filtersApplied > 0) {
        const filterScore = (filterMatches / filtersApplied) * 100;
        score = Math.round(filterScore);
      }
      // If no filters applied, keep 100% (perfect match from matrix)
      
      const meta = REGISTRY[name] || { description: "", when: [], why: "Direct matrix match", scopes: [], link: "#", tags: [] };
      const result = { 
        name, 
        score: Math.max(score, 0), 
        reasons,
        ...meta 
      };

      if (result.score === 100) {
        matches.push(result);
      } else if (result.score > 0) {
        mismatches.push(result);
      }
      // Don't show components with 0% match
    });

    return { matches, mismatches: mismatches.sort((a, b) => b.score - a.score) };
  }, [severity, msgType, filterAnswers]);

  const renderCard = (r, isMatch) => (
    <div key={r.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <a
          href={r.link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors group-hover:underline"
        >
          {r.name}
          <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
        </a>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isMatch 
              ? "bg-green-50 text-green-700" 
              : "bg-yellow-50 text-yellow-700"
          }`}>
            {r.score}% match
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-3">{r.description}</p>
      
      {isMatch && r.why && (
        <div className="mb-3">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Why this matches</div>
          <p className="text-sm text-gray-700">{r.why}</p>
        </div>
      )}
      
      {!isMatch && r.reasons && r.reasons.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Why this may not match perfectly</div>
          {r.reasons.length === 1 ? (
            <p className="text-sm text-gray-700">{r.reasons[0]}</p>
          ) : (
            <ul className="text-sm text-gray-700 space-y-1">
              {r.reasons.map((reason, i) => (
                <li key={i}>• {reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="mb-3">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Where to place this component</div>
        <p className="text-sm text-gray-700">{r.scopes ? r.scopes.map(scope => `${scope} level`).join(", ") : "Not specified"}</p>
      </div>
      
      {r.tags && (
        <div className="flex flex-wrap gap-1 mt-3">
          {r.tags.map(tag => (
            <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const clearAll = () => {
    setSeverity(null);
    setMsgType(null);
    setFilterAnswers({});
    setShowFilters(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-col lg:flex-row">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Component picker</h1>
          <p className="text-gray-600">
            Select <span className="font-medium text-gray-800">severity</span> and <span className="font-medium text-gray-800">message type</span> to find the right component. Use filters to refine results.
          </p>
        </div>
        
        <button 
          onClick={clearAll}
          className="px-4 py-2 rounded-lg text-sm border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 transition-colors font-medium"
        >
          Reset all
        </button>
      </header>

      <section className="py-4 px-4 bg-gray-50 rounded-xl">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-900">1. Select severity</h3>
          <p className="text-sm text-gray-500">How critical is this message for the user experience?</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SEVERITIES.map((s) => (
            <div
              key={s.name}
              onClick={() => setSeverity(s.name)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                severity === s.name
                  ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="font-medium text-sm mb-1">{s.name}</div>
              <div className={`text-xs ${severity === s.name ? "text-gray-200" : "text-gray-500"}`}>
                {s.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-4 px-4 bg-gray-50 rounded-xl">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-900">2. Select message type</h3>
          <p className="text-sm text-gray-500">What kind of communication pattern do you need?</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TYPES.map((t) => (
            <div
              key={t.name}
              onClick={() => setMsgType(t.name)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                msgType === t.name
                  ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="font-medium text-sm mb-1">{t.name}</div>
              <div className={`text-xs ${msgType === t.name ? "text-gray-200" : "text-gray-500"}`}>
                {t.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-4 px-4 bg-gray-50 rounded-xl">
        <div className={`flex items-center justify-between ${showFilters ? "mb-3" : ""}`}>
          <div>
            <h3 className="text-base font-semibold text-gray-900">3. Refine with filters</h3>
            <p className="text-sm text-gray-500 font-light">Optional</p>
          </div>
          <button
            className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
        </div>
        
        {showFilters && (
          <div className="space-y-4 py-1">
            {FILTERS.map((f, index) => (
              <div key={f.question} className={index < FILTERS.length - 1 ? "pb-4" : ""}>
                <p className="text-sm font-medium text-gray-800 mb-1">{f.question}</p>
                <p className="text-xs text-gray-500 mb-3">{f.description}</p>
                <div className="flex flex-wrap gap-2">
                  {f.options.map((opt) => (
                    <Chip
                      key={opt}
                      variant="filter"
                      selected={filterAnswers[f.question] === opt}
                      onClick={() => setFilterAnswers({
                        ...filterAnswers, 
                        [f.question]: filterAnswers[f.question] === opt ? null : opt
                      })}
                    >
                      {opt}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended components</h3>
        {!severity || !msgType ? (
          <div className="text-center py-12 px-4 bg-gray-50 rounded-xl">
            <div className="text-gray-400 mb-4">
              <span className="text-4xl">🎯</span>
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">Get started</p>
            <p className="text-gray-500 text-sm">Select severity and message type above to see recommendations</p>
          </div>
        ) : matches.length === 0 && mismatches.length === 0 ? (
          <div className="p-6 rounded-xl bg-blue-50">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-xl">💡</span>
              <div>
                <p className="text-blue-600 font-medium mb-1">
                  No components found for {severity} + {msgType}
                </p>
                <p className="text-blue-600 text-sm mb-3">
                  This combination typically indicates a design pattern that might need reconsideration.
                </p>
                <div className="text-sm text-blue-600">
                  <strong>Suggestions:</strong>
                  <ul className="mt-1 space-y-1 ml-4">
                    <li>• For critical issues, consider "Notification" type instead</li>
                    <li>• For validation, "Major" or "Minor" severity usually works better</li>
                    <li>• For indicators, try "Informational" or "Minor" severity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.length > 0 && (
              <div>
                <h4 className="text-sm font-normal text-gray-600 mb-3 flex items-center gap-2">
                  <span>✅</span>
                  Perfect matches ({matches.length})
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {matches.map((r) => renderCard(r, true))}
                </div>
              </div>
            )}
            
            {mismatches.length > 0 && (
              <div>
                <h4 className="text-sm font-normal text-gray-600 mb-3 flex items-center gap-2">
                  <span>⚠️</span>
                  Possible alternatives ({mismatches.length})
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {mismatches.map((r) => renderCard(r, false))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}