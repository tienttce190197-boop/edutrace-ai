export function updateRoleWorkspace(user, root = document) {
  const workspace = root.getElementById("roleWorkspace");
  if (!workspace) return;
  const parent = user?.role === "parent";
  const doctor = user?.role === "doctor";
  const center = user?.role === "center" || user?.role === "investor";
  workspace.hidden = !parent && !doctor && !center;
  const parentWorkspace = root.getElementById("parentWorkspace");
  if (parentWorkspace) parentWorkspace.hidden = !parent;
  const parentReferral = root.getElementById("parentReferralPanel");
  if (parentReferral) parentReferral.hidden = !parent;
  root.getElementById("doctorWorkspace").hidden = !doctor;
  root.getElementById("investorWorkspace").hidden = !center;
  const clinical = root.getElementById("clinicalPanel");
  if (clinical) clinical.style.display = doctor ? '' : 'none';
  const report = root.getElementById("investorReportPanel");
  if (report) report.style.display = center ? '' : 'none';
  const centerPanel = root.getElementById("centerPanel");
  if (centerPanel) centerPanel.style.display = center ? '' : 'none';
  if (!parent && !doctor && !center) return;
  root.getElementById("roleWorkspaceBadge").textContent = parent ? "Phụ huynh" : doctor ? "Bác sĩ / Chuyên viên" : "Trung tâm / Đối tác";
  root.getElementById("roleWorkspaceTitle").textContent = parent ? "Không gian phụ huynh" : doctor ? "Không gian chuyên môn" : "Không gian trung tâm";
  root.getElementById("roleWorkspaceGreeting").textContent = `Xin chào ${user.displayName || "bạn"}. Khám phá các công cụ và thông tin dành cho bạn.`;
}
