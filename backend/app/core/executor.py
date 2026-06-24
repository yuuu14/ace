"""Execute a capability's decision_points against an incident context."""

from app.schemas.capability import Capability, DecisionPoint


class ExecutionTrace:
    def __init__(self) -> None:
        self.steps: list[dict] = []

    def log(self, step: int, condition: str, action: str, status: str = "ok", detail: str | None = None) -> None:
        self.steps.append({
            "step": step,
            "condition": condition,
            "action": action,
            "status": status,
            "detail": detail,
        })


def execute_capability(capability: Capability, context: dict) -> ExecutionTrace:
    """
    Walk the decision tree and emit a deterministic execution trace.

    In a real deployment this would dispatch actual tool calls; here we simulate
    the recovery steps so the frontend can render a live terminal feed.
    """
    trace = ExecutionTrace()
    for idx, point in enumerate(capability.decision_points, start=1):
        decision = DecisionPoint.model_validate(point)
        ctx_value = context.get(decision.condition.split()[0])
        triggered = _evaluate_condition(decision.condition, ctx_value)
        if triggered:
            trace.log(
                idx,
                decision.condition,
                decision.action,
                status="resolved",
                detail=f"Executed {decision.action}" + (f" with failsafe {decision.failsafe}" if decision.failsafe else ""),
            )
        else:
            trace.log(idx, decision.condition, decision.action, status="skipped")
    return trace


def _evaluate_condition(condition: str, ctx_value: object) -> bool:
    """Naive condition evaluator for demo traces."""
    if "==" in condition:
        _, rhs = condition.split("==", 1)
        rhs = rhs.strip().strip('"').lower()
        lhs = str(ctx_value).lower()
        if rhs == "true":
            return lhs == "true"
        if rhs == "false":
            return lhs == "false"
        return lhs == rhs
    return bool(ctx_value)
