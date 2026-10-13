import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  error: unknown;
};

export class RuntimeErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Keep console output for debugging in dev
    console.error("RuntimeErrorBoundary caught an error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message =
      this.state.error instanceof Error
        ? this.state.error.message
        : typeof this.state.error === "string"
          ? this.state.error
          : "Unknown error";

    return (
      <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          App crashed during render
        </h1>
        <p style={{ marginBottom: 12 }}>
          Fix the error below and the page will recover on refresh/HMR.
        </p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#111827",
            color: "#e5e7eb",
            padding: 12,
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          {message}
        </pre>
      </div>
    );
  }
}

