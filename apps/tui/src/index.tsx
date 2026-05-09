import { readFile } from "node:fs/promises";

import { TextAttributes } from "@opentui/core";
import { render } from "@opentui/solid";

import { createTuiViewModel, type TuiReport } from "../../../src/tui-view-model";

const [, , reportPath, mode = "dashboard"] = process.argv;
const report = reportPath ? (JSON.parse(await readFile(reportPath, "utf8")) as TuiReport) : null;
const viewModel = report ? createTuiViewModel({ report }) : null;

render(() => (
  <box flexDirection="column" flexGrow={1} padding={1}>
    <box flexDirection="column">
      <ascii_font font="tiny" text="Solid Doctor" />
      <text attributes={TextAttributes.BOLD}>
        {mode === "inspect" ? "Issue Explorer" : "Doctor Dashboard"}
      </text>
      <text>Score: {viewModel?.score.overall ?? 100}/100</text>
      <text attributes={TextAttributes.DIM}>Issues: {viewModel?.issues.length ?? 0}</text>
    </box>
    <box flexDirection="column" marginTop={1}>
      {(viewModel?.issues ?? []).map((issue) => (
        <text>
          [{issue.severity}] {issue.ruleId} {issue.filePath}:{issue.line}
        </text>
      ))}
    </box>
    <box flexDirection="column" marginTop={1}>
      <text attributes={TextAttributes.BOLD}>Detail</text>
      <text>{viewModel?.selectedIssue?.title ?? "No diagnostics selected."}</text>
      <text>{viewModel?.selectedIssue?.remediation ?? ""}</text>
      <text attributes={TextAttributes.DIM}>{viewModel?.selectedIssue?.codeContext ?? ""}</text>
    </box>
  </box>
));
