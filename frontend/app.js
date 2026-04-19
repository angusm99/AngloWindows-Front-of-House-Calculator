const state = {
  catalog: {
    groups: [],
    options: {
      glass_options: [],
      frame_colours: [],
      hardware_colours: [],
      hinge_types: [],
      panel_counts: [],
      door_types: [],
      leaf_counts: [],
    },
  },
  activeTab: "builder",
  currentMode: "upload",
  currentCalculation: null,
  currentEditIndex: null,
  uploadRows: [],
  workspaceVisible: false,
  uploadedFileName: "",
  extractionSummary: "",
  sessionUser: null,
  quote: {
    id: null,
    quote_number: "",
    customer_name: "",
    phone_number: "",
    address: "",
    salesperson: "",
    installer: "",
    notes: "",
    markup_percent: 20,
    discount_type: "amount",
    discount_value: 0,
    lines: [],
  },
};

const elements = {};
const REFERENCE_DOCS = [
  {
    title: "AI Studio Handoff",
    note: "Latest technical handoff imported from the Manus ZIP into the local docs folder.",
    path: "docs/AI_STUDIO_HANDOFF.md",
  },
  {
    title: "System Master",
    note: "Master architecture and engine breakdown for the 8 Anglo system groups.",
    path: "docs/ANGLO_SYSTEM_MASTER_FINAL.md",
  },
  {
    title: "Reception Guide",
    note: "Front-desk operating guide for quick quoting and export workflow.",
    path: "docs/RECEPTION_USER_GUIDE.md",
  },
  {
    title: "Front Of House Brief",
    note: "Project brief for the reception calculator rollout and development scope.",
    path: "docs/FRONT_OF_HOUSE_CALCULATOR_BRIEF.md",
  },
  {
    title: "Finished Goods Analysis",
    note: "Reference notes for the imported pricing templates and current assumptions.",
    path: "docs/FINISHED_GOODS_ANALYSIS.md",
  },
  {
    title: "Latest Manus Import",
    note: "Tracking note for the full fresh ZIP extracted into imports/manus-latest.",
    path: "docs/manus-latest-import.md",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  bindEvents();
  initialise();
});

function bindElements() {
  const ids = [
    "hero-upload-button",
    "hero-manual-button",
    "hero-upload-status",
    "hero-extraction-summary",
    "hero-units-count",
    "hero-subtotal",
    "hero-total",
    "landing-quote-number",
    "landing-customer-name",
    "landing-line-count",
    "landing-draft-total",
    "tab-builder",
    "tab-saved",
    "tab-pricing",
    "builder-tab-panel",
    "saved-tab-panel",
    "pricing-tab-panel",
    "builder-workspace",
    "builder-placeholder",
    "before-you-begin",
    "start-new-draft",
    "system-coverage",
    "reference-docs",
    "login-status",
    "google-login-button",
    "quote-number",
    "customer-name",
    "phone-number",
    "address",
    "salesperson",
    "installer",
    "notes",
    "mode-upload",
    "mode-manual",
    "upload-panel",
    "manual-panel",
    "pdf-file",
    "prepare-upload-review",
    "add-upload-row",
    "upload-table-body",
    "confirm-upload-rows",
    "system-group",
    "system-name",
    "product-code",
    "quantity",
    "width-mm",
    "height-mm",
    "run-length",
    "glass-code",
    "frame-colour",
    "hardware-colour",
    "hinge-type",
    "panel-count",
    "leaf-count",
    "door-type",
    "door-quantity",
    "calculate-product",
    "add-to-quote",
    "reset-product-form",
    "calculation-preview",
    "preview-title",
    "preview-subtotal",
    "preview-message",
    "line-item-body",
    "edit-state-pill",
    "quote-search",
    "refresh-quotes",
    "recent-quotes",
    "summary-quote-number",
    "quote-lines",
    "quote-markup",
    "discount-type",
    "discount-value",
    "subtotal-value",
    "markup-value",
    "discount-amount-value",
    "grand-total-value",
    "save-quote",
    "preview-quote",
    "export-quote",
    "email-quote",
    "toast",
  ];

  for (const id of ids) {
    elements[toCamel(id)] = document.getElementById(id);
  }
}

function bindEvents() {
  elements.heroUploadButton.addEventListener("click", () => openUploadFlow(true));
  elements.heroManualButton.addEventListener("click", openManualBuilder);
  elements.tabBuilder.addEventListener("click", () => setActiveTab("builder"));
  elements.tabSaved.addEventListener("click", () => setActiveTab("saved"));
  elements.tabPricing.addEventListener("click", () => setActiveTab("pricing"));
  elements.startNewDraft.addEventListener("click", startNewDraft);
  elements.googleLoginButton.addEventListener("click", handleGoogleDemoLogin);
  elements.modeUpload.addEventListener("click", () => switchMode("upload"));
  elements.modeManual.addEventListener("click", () => switchMode("manual"));
  elements.pdfFile.addEventListener("change", handlePdfFileSelection);
  elements.prepareUploadReview.addEventListener("click", prepareUploadReview);
  elements.addUploadRow.addEventListener("click", () => {
    state.uploadRows.push(createBlankUploadRow());
    renderUploadTable();
  });
  elements.confirmUploadRows.addEventListener("click", confirmUploadRows);
  elements.systemGroup.addEventListener("change", handleSystemGroupChange);
  elements.calculateProduct.addEventListener("click", calculateCurrentProduct);
  elements.addToQuote.addEventListener("click", addCurrentProductToQuote);
  elements.resetProductForm.addEventListener("click", resetProductForm);
  elements.refreshQuotes.addEventListener("click", () => loadRecentQuotes(elements.quoteSearch.value.trim()));
  elements.quoteSearch.addEventListener("input", debounce((event) => loadRecentQuotes(event.target.value.trim()), 250));
  elements.quoteMarkup.addEventListener("input", renderQuoteWorkspace);
  elements.discountType.addEventListener("change", renderQuoteWorkspace);
  elements.discountValue.addEventListener("input", renderQuoteWorkspace);
  elements.saveQuote.addEventListener("click", saveQuote);
  elements.previewQuote.addEventListener("click", () => openQuotePreview(false));
  elements.exportQuote.addEventListener("click", () => openQuotePreview(true));
  elements.emailQuote.addEventListener("click", emailQuote);
}

async function initialise() {
  setActiveTab("builder");
  setWorkspaceVisible(false);
  switchMode("upload");
  renderHeroStatus();

  try {
    const [groupData, optionData] = await Promise.all([
      fetchJson("/api/catalog/system-groups"),
      fetchJson("/api/catalog/options"),
    ]);

    state.catalog.groups = groupData.groups;
    state.catalog.options = optionData;
    hydrateFormOptions();
    renderReferenceData();
    renderUploadTable();
    resetProductForm();
    renderQuoteWorkspace();
    await loadRecentQuotes();
    showToast("Calculator ready. You can start with Upload Drawing or Manual Entry.");
  } catch (error) {
    showToast(error.message || "Unable to load the calculator data.");
  }
}

function setActiveTab(tab) {
  state.activeTab = tab;
  elements.tabBuilder.classList.toggle("is-active", tab === "builder");
  elements.tabSaved.classList.toggle("is-active", tab === "saved");
  elements.tabPricing.classList.toggle("is-active", tab === "pricing");
  elements.builderTabPanel.classList.toggle("hidden", tab !== "builder");
  elements.savedTabPanel.classList.toggle("hidden", tab !== "saved");
  elements.pricingTabPanel.classList.toggle("hidden", tab !== "pricing");
}

function setWorkspaceVisible(visible) {
  state.workspaceVisible = visible;
  elements.builderWorkspace.classList.toggle("hidden", !visible);
  elements.builderPlaceholder.classList.toggle("hidden", visible);
  elements.beforeYouBegin.classList.toggle("hidden", visible);
}

function openUploadFlow(openPicker) {
  setActiveTab("builder");
  setWorkspaceVisible(true);
  switchMode("upload");
  if (openPicker) {
    elements.pdfFile.click();
  }
}

function openManualBuilder() {
  state.extractionSummary = "";
  renderHeroStatus();
  setActiveTab("builder");
  setWorkspaceVisible(true);
  switchMode("manual");
  showToast("Manual builder opened.");
}

function startNewDraft() {
  state.currentCalculation = null;
  state.currentEditIndex = null;
  state.uploadRows = [];
  state.uploadedFileName = "";
  state.extractionSummary = "";
  state.quote = {
    id: null,
    quote_number: "",
    customer_name: "",
    phone_number: "",
    address: "",
    salesperson: "",
    installer: "",
    notes: "",
    markup_percent: 20,
    discount_type: "amount",
    discount_value: 0,
    lines: [],
  };

  elements.quoteNumber.value = "";
  elements.customerName.value = "";
  elements.phoneNumber.value = "";
  elements.address.value = "";
  elements.salesperson.value = state.sessionUser || "";
  elements.installer.value = "";
  elements.notes.value = "";
  elements.quoteMarkup.value = "20";
  elements.discountType.value = "amount";
  elements.discountValue.value = "0";
  elements.pdfFile.value = "";

  setActiveTab("builder");
  setWorkspaceVisible(false);
  switchMode("upload");
  renderHeroStatus();
  renderUploadTable();
  resetProductForm();
  renderQuoteWorkspace();
  showToast("Started a new quote draft.");
}

function renderReferenceData() {
  elements.systemCoverage.innerHTML = state.catalog.groups
    .map(
      (group) => `
        <article class="metric-card">
          <h3>${escapeHtml(group.name)}</h3>
          <span class="metric-value">${escapeHtml(String(group.systems.length))}</span>
          <p>${escapeHtml(group.description)}</p>
        </article>
      `,
    )
    .join("");

  elements.referenceDocs.innerHTML = REFERENCE_DOCS.map(
    (doc) => `
      <article class="reference-card">
        <h3>${escapeHtml(doc.title)}</h3>
        <p>${escapeHtml(doc.note)}</p>
        <p>${escapeHtml(doc.path)}</p>
      </article>
    `,
  ).join("");
}

function renderHeroStatus() {
  elements.heroUploadStatus.textContent = state.uploadedFileName
    ? `Latest file: ${state.uploadedFileName}`
    : "Supported format: PDF drawing schedules.";
  elements.heroExtractionSummary.textContent = state.extractionSummary || "";
}

function renderHeroMetrics(totals) {
  elements.heroUnitsCount.textContent = String(state.quote.lines.length);
  elements.heroSubtotal.textContent = currency(totals.subtotal);
  elements.heroTotal.textContent = currency(totals.total);
}

function renderLandingSnapshot(totals) {
  elements.landingQuoteNumber.textContent = state.quote.quote_number || "Unsaved quote";
  elements.landingCustomerName.textContent = state.quote.customer_name || "Waiting for intake";
  elements.landingLineCount.textContent = String(state.quote.lines.length);
  elements.landingDraftTotal.textContent = currency(totals.total);
}

function hydrateFormOptions() {
  fillSelect(elements.systemGroup, state.catalog.groups.map((group) => ({ value: group.id, label: group.name })));
  fillSelect(elements.glassCode, state.catalog.options.glass_options.map((item) => ({ value: item.code, label: item.description })));
  fillSelect(elements.frameColour, state.catalog.options.frame_colours);
  fillSelect(elements.hardwareColour, state.catalog.options.hardware_colours);
  fillSelect(elements.hingeType, state.catalog.options.hinge_types);
  fillSelect(elements.panelCount, state.catalog.options.panel_counts);
  fillSelect(elements.leafCount, state.catalog.options.leaf_counts);
  fillSelect(elements.doorType, state.catalog.options.door_types);

  if (state.catalog.groups[0]) {
    elements.systemGroup.value = state.catalog.groups[0].id;
    populateSystemSelect(state.catalog.groups[0].id);
  }
  syncQuoteHeaderToState();
}

function switchMode(mode) {
  state.currentMode = mode;
  elements.modeUpload.classList.toggle("is-active", mode === "upload");
  elements.modeManual.classList.toggle("is-active", mode === "manual");
  elements.uploadPanel.classList.toggle("hidden", mode !== "upload");
  elements.manualPanel.classList.toggle("hidden", mode !== "manual");
}

function handleGoogleDemoLogin() {
  state.sessionUser = "Reception Desk";
  elements.loginStatus.textContent = "Google sign-in demo active";
  if (!elements.salesperson.value.trim()) {
    elements.salesperson.value = state.sessionUser;
  }
  showToast("Google demo sign-in activated for the reception workflow.");
}

function handlePdfFileSelection() {
  const file = elements.pdfFile.files[0];
  state.uploadedFileName = file ? file.name : "";
  state.extractionSummary = "";
  renderHeroStatus();
}

function populateSystemSelect(groupId, selectedSystem = "") {
  const group = state.catalog.groups.find((item) => item.id === groupId);
  const options = (group?.systems || []).map((system) => ({
    value: system.name,
    label: system.name,
  }));
  fillSelect(elements.systemName, options);
  if (selectedSystem) {
    elements.systemName.value = selectedSystem;
  }
  updateFieldVisibility(groupId);
}

function handleSystemGroupChange() {
  populateSystemSelect(elements.systemGroup.value);
}

function updateFieldVisibility(groupId) {
  const fieldMap = {
    casement: ["width", "height", "glass", "frame", "hardware", "hinge"],
    sliding_window: ["width", "height", "glass", "frame", "hardware", "panel"],
    sliding_door_domestic: ["width", "height", "glass", "frame", "hardware", "panel"],
    sliding_door_hd: ["width", "height", "glass", "frame", "hardware", "panel"],
    sliding_folding: ["width", "height", "glass", "frame", "hardware", "leaf"],
    shopfront: ["width", "height", "glass", "frame", "hardware", "door-type", "door-qty"],
    frameless_folding: ["width", "height", "glass", "frame", "panel"],
    frameless_balustrade: ["run", "glass", "frame"],
  };

  const activeFields = new Set(fieldMap[groupId] || ["width", "height", "glass", "frame", "hardware"]);
  document.querySelectorAll(".dimension-field").forEach((field) => {
    const key = field.dataset.field;
    field.classList.toggle("hidden", !activeFields.has(key));
  });
}

async function prepareUploadReview() {
  setActiveTab("builder");
  setWorkspaceVisible(true);
  switchMode("upload");
  const file = elements.pdfFile.files[0];
  if (!file) {
    showToast("Select a PDF first so we can prepare the review table.");
    return;
  }

  state.uploadedFileName = file.name;
  renderHeroStatus();

  try {
    const intake = await extractPdfRows(file);
    state.uploadRows = intake.rows.map((row) => createUploadRowFromIntake(row));
    if (state.uploadRows.length === 0) {
      state.extractionSummary = "No schedule rows were found in that PDF.";
      renderHeroStatus();
      renderUploadTable();
      showToast("No schedule rows were found in that PDF. You can still add rows manually.");
      return;
    }
    renderUploadTable();
    const reviewCount = state.uploadRows.filter((row) => !isUploadRowValid(row)).length;
    const warningCount = intake.warnings.length;
    state.extractionSummary = `${state.uploadRows.length} row(s) extracted${reviewCount ? `, ${reviewCount} need review` : ""}${warningCount ? `, ${warningCount} warning(s)` : ""}.`;
    renderHeroStatus();
    showToast(
      `${state.uploadRows.length} row(s) extracted${reviewCount ? `, ${reviewCount} need review` : ""}${warningCount ? `, ${warningCount} warning(s)` : ""}.`,
    );
  } catch (error) {
    if (state.uploadRows.length === 0) {
      state.uploadRows = [createBlankUploadRow("W1"), createBlankUploadRow("D1")];
    }
    state.extractionSummary = "Extraction fell back to manual review rows.";
    renderHeroStatus();
    renderUploadTable();
    showToast(error.message || `Unable to extract data from ${file.name}. Manual rows were prepared instead.`);
  }
}

function createBlankUploadRow(code = "") {
  return {
    id: crypto.randomUUID(),
    code,
    system_group: "casement",
    system_name: "30.5mm",
    width_mm: "",
    height_mm: "",
    run_length_m: "",
    glass_code: state.catalog.options.glass_options[0]?.code || "4mm clear",
    frame_colour: state.catalog.options.frame_colours[0]?.value || "white",
    hardware_colour: state.catalog.options.hardware_colours[0]?.value || "standard",
    quantity: 1,
    hinge_type: state.catalog.options.hinge_types[0]?.value || "top_hung",
    panel_count: Number(state.catalog.options.panel_counts[0]?.value || 2),
    leaf_count: Number(state.catalog.options.leaf_counts[0]?.value || 3),
    door_type: state.catalog.options.door_types[0]?.value || "single_hinged",
    door_quantity: 1,
    flags: [],
  };
}

function createUploadRowFromIntake(row) {
  return {
    id: crypto.randomUUID(),
    code: row.code || "",
    system_group: row.system_group || "casement",
    system_name: row.system_name || "30.5mm",
    width_mm: row.width_mm ?? "",
    height_mm: row.height_mm ?? "",
    run_length_m: row.run_length_m ?? "",
    glass_code: row.glass_code || state.catalog.options.glass_options[0]?.code || "4mm clear",
    frame_colour: row.frame_colour || state.catalog.options.frame_colours[0]?.value || "white",
    hardware_colour: row.hardware_colour || state.catalog.options.hardware_colours[0]?.value || "standard",
    quantity: Number(row.quantity || 1),
    hinge_type: row.hinge_type || state.catalog.options.hinge_types[0]?.value || "top_hung",
    panel_count: Number(row.panel_count || state.catalog.options.panel_counts[0]?.value || 2),
    leaf_count: Number(row.leaf_count || state.catalog.options.leaf_counts[0]?.value || 3),
    door_type: row.door_type || state.catalog.options.door_types[0]?.value || "single_hinged",
    door_quantity: Number(row.door_quantity || 1),
    flags: Array.isArray(row.flags) ? row.flags : [],
  };
}

function renderUploadTable() {
  if (state.uploadRows.length === 0) {
    elements.uploadTableBody.innerHTML = `
      <tr>
        <td colspan="11">
          <div class="empty-state">Select a PDF or add a row to start the review table.</div>
        </td>
      </tr>
    `;
    return;
  }

  elements.uploadTableBody.innerHTML = state.uploadRows
    .map((row, index) => {
      const valid = isUploadRowValid(row);
      const rowClass = valid ? "" : "needs-review";
      const reviewTitle = escapeHtml((row.flags || []).join(" | "));
      return `
        <tr class="${rowClass}">
          <td><input data-row="${index}" data-field="code" value="${escapeHtml(row.code)}" /></td>
          <td>${renderGroupSelect(index, row.system_group)}</td>
          <td>${renderSystemSelect(index, row.system_group, row.system_name)}</td>
          <td><input data-row="${index}" data-field="width_mm" type="number" min="1" step="1" value="${escapeHtml(row.width_mm)}" /></td>
          <td><input data-row="${index}" data-field="height_mm" type="number" min="1" step="1" value="${escapeHtml(row.height_mm)}" /></td>
          <td><input data-row="${index}" data-field="run_length_m" type="number" min="0.1" step="0.1" value="${escapeHtml(row.run_length_m)}" /></td>
          <td>${renderOptionSelect(index, "glass_code", row.glass_code, state.catalog.options.glass_options.map((item) => ({ value: item.code, label: item.description })))}</td>
          <td>${renderOptionSelect(index, "frame_colour", row.frame_colour, state.catalog.options.frame_colours)}</td>
          <td><input data-row="${index}" data-field="quantity" type="number" min="1" step="1" value="${escapeHtml(String(row.quantity))}" /></td>
          <td>
            <span class="review-status ${valid ? "is-ready" : "is-warning"}" title="${reviewTitle}">
              ${valid ? "Ready" : "Review"}
            </span>
          </td>
          <td><button class="ghost-button" type="button" data-action="remove-upload-row" data-row="${index}">Remove</button></td>
        </tr>
      `;
    })
    .join("");

  elements.uploadTableBody.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("change", handleUploadFieldChange);
  });
  elements.uploadTableBody.querySelectorAll("[data-action='remove-upload-row']").forEach((button) => {
    button.addEventListener("click", () => {
      state.uploadRows.splice(Number(button.dataset.row), 1);
      renderUploadTable();
    });
  });
}

function renderGroupSelect(index, value) {
  const options = state.catalog.groups
    .map((group) => `<option value="${group.id}" ${group.id === value ? "selected" : ""}>${escapeHtml(group.name)}</option>`)
    .join("");
  return `<select data-row="${index}" data-field="system_group">${options}</select>`;
}

function renderSystemSelect(index, groupId, value) {
  const group = state.catalog.groups.find((item) => item.id === groupId) || state.catalog.groups[0];
  const options = (group?.systems || [])
    .map((system) => `<option value="${escapeHtml(system.name)}" ${system.name === value ? "selected" : ""}>${escapeHtml(system.name)}</option>`)
    .join("");
  return `<select data-row="${index}" data-field="system_name">${options}</select>`;
}

function renderOptionSelect(index, field, value, options) {
  const html = options
    .map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
    .join("");
  return `<select data-row="${index}" data-field="${field}">${html}</select>`;
}

function handleUploadFieldChange(event) {
  const { row, field } = event.target.dataset;
  const index = Number(row);
  const current = state.uploadRows[index];
  if (!current) {
    return;
  }

  current[field] = event.target.value;
  current.flags = [];
  if (field === "quantity") {
    current.quantity = Number(event.target.value || 1);
  }
  if (field === "system_group") {
    const group = state.catalog.groups.find((item) => item.id === event.target.value);
    current.system_name = group?.systems[0]?.name || "";
  }
  renderUploadTable();
}

async function confirmUploadRows() {
  if (state.uploadRows.length === 0) {
    showToast("There are no upload rows to confirm yet.");
    return;
  }

  const invalidRow = state.uploadRows.find((row) => !isUploadRowValid(row));
  if (invalidRow) {
    showToast("One or more upload rows still need review before they can be added.");
    return;
  }

  try {
    for (const row of state.uploadRows) {
      const calculation = await calculateLine(row);
      state.quote.lines.push(buildQuoteLineFromCalculation(row, calculation));
    }
    state.uploadRows = [];
    state.extractionSummary = "Reviewed rows added to the quote workspace.";
    renderHeroStatus();
    renderUploadTable();
    renderQuoteWorkspace();
    showToast("Reviewed rows added to the quote workspace.");
  } catch (error) {
    showToast(error.message || "Unable to price one of the upload rows.");
  }
}

function isUploadRowValid(row) {
  if (Array.isArray(row.flags) && row.flags.length > 0) {
    return false;
  }
  if (!row.system_group || !row.system_name || !row.glass_code || !row.frame_colour || !row.quantity) {
    return false;
  }
  if (row.system_group === "frameless_balustrade") {
    return Number(row.run_length_m) > 0;
  }
  return Number(row.width_mm) > 0 && Number(row.height_mm) > 0;
}

async function calculateCurrentProduct() {
  try {
    const payload = collectProductFormPayload();
    const calculation = await calculateLine(payload);
    state.currentCalculation = calculation;
    elements.addToQuote.disabled = false;
    renderCalculationPreview();
    showToast("Price calculated. You can now add this product to the quote.");
  } catch (error) {
    state.currentCalculation = null;
    elements.addToQuote.disabled = true;
    renderCalculationPreview();
    showToast(error.message || "Unable to calculate the product.");
  }
}

async function calculateLine(payload) {
  return fetchJson("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function extractPdfRows(file) {
  const formData = new FormData();
  formData.append("file", file);
  return fetchJson("/api/pdf-intake", {
    method: "POST",
    body: formData,
  });
}

function collectProductFormPayload() {
  const payload = {
    code: elements.productCode.value.trim() || null,
    system_group: elements.systemGroup.value,
    system_name: elements.systemName.value,
    width_mm: toNullableNumber(elements.widthMm.value),
    height_mm: toNullableNumber(elements.heightMm.value),
    quantity: toInt(elements.quantity.value, 1),
    hinge_type: elements.hingeType.value || null,
    door_type: elements.doorType.value || null,
    panel_count: toNullableInt(elements.panelCount.value),
    door_quantity: toNullableInt(elements.doorQuantity.value),
    leaf_count: toNullableInt(elements.leafCount.value),
    run_length_m: toNullableNumber(elements.runLength.value),
    glass_code: elements.glassCode.value,
    frame_colour: elements.frameColour.value,
    hardware_colour: elements.hardwareColour.value,
  };

  if (payload.system_group === "frameless_balustrade") {
    payload.width_mm = null;
    payload.height_mm = null;
    payload.hardware_colour = "standard";
  }

  return payload;
}

function renderCalculationPreview() {
  if (!state.currentCalculation) {
    elements.calculationPreview.classList.add("hidden");
    elements.lineItemBody.innerHTML = "";
    return;
  }

  const calc = state.currentCalculation;
  elements.calculationPreview.classList.remove("hidden");
  elements.previewTitle.textContent = `${labelForGroup(calc.system_group)} / ${calc.system_name}`;
  elements.previewSubtotal.textContent = currency(calc.subtotal);
  elements.previewMessage.textContent = `${calc.message} Suggested total with the default ${formatNumber(calc.markup_percent)}% markup is ${currency(calc.total)}.`;
  elements.lineItemBody.innerHTML = calc.line_items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(String(item.qty))}</td>
          <td>${currency(item.unit_price)}</td>
          <td>${currency(item.total)}</td>
        </tr>
      `,
    )
    .join("");
}

function addCurrentProductToQuote() {
  if (!state.currentCalculation) {
    showToast("Calculate the product first so the quote uses the latest price.");
    return;
  }

  const payload = collectProductFormPayload();
  const line = buildQuoteLineFromCalculation(payload, state.currentCalculation);
  const isEditing = state.currentEditIndex !== null;
  if (state.currentEditIndex === null) {
    state.quote.lines.push(line);
  } else {
    state.quote.lines[state.currentEditIndex] = line;
  }

  setActiveTab("builder");
  setWorkspaceVisible(true);
  renderQuoteWorkspace();
  resetProductForm();
  switchMode("manual");
  showToast(isEditing ? "Product updated." : "Product added to quote.");
}

function buildQuoteLineFromCalculation(payload, calculation) {
  const quantity = payload.quantity || 1;
  const baseUnitPrice = roundMoney(Number(calculation.subtotal) / quantity);
  return {
    code: payload.code,
    description: buildDescription(payload),
    system_group: calculation.system_group,
    system_name: calculation.system_name,
    engine_type: calculation.engine_type,
    width_mm: payload.width_mm,
    height_mm: payload.height_mm,
    quantity,
    glass_code: payload.glass_code,
    frame_colour: payload.frame_colour,
    hardware_colour: payload.hardware_colour,
    hinge_type: payload.hinge_type,
    door_type: payload.door_type,
    leaf_count: payload.leaf_count,
    panel_count: payload.panel_count,
    door_quantity: payload.door_quantity,
    run_length_m: payload.run_length_m,
    unit_price_zar: baseUnitPrice,
  };
}

function buildDescription(payload) {
  const sizeText = payload.run_length_m
    ? `${payload.run_length_m}m run`
    : `${payload.width_mm || "-"} x ${payload.height_mm || "-"} mm`;
  return [payload.code, payload.system_name, sizeText, payload.glass_code]
    .filter(Boolean)
    .join(" | ");
}

function resetProductForm() {
  state.currentCalculation = null;
  state.currentEditIndex = null;
  elements.productCode.value = "";
  elements.quantity.value = "1";
  elements.widthMm.value = "";
  elements.heightMm.value = "";
  elements.runLength.value = "";
  elements.doorQuantity.value = "1";
  elements.editStatePill.textContent = "Adding a new product";
  elements.addToQuote.textContent = "Add To Quote";
  elements.addToQuote.disabled = true;
  if (state.catalog.groups[0]) {
    elements.systemGroup.value = state.catalog.groups[0].id;
    populateSystemSelect(state.catalog.groups[0].id);
  }
  renderCalculationPreview();
}

function renderQuoteWorkspace() {
  syncQuoteHeaderToState();
  const totals = computeQuoteTotals();
  renderHeroMetrics(totals);
  renderLandingSnapshot(totals);
  elements.summaryQuoteNumber.textContent = state.quote.quote_number || "Unsaved quote";
  elements.subtotalValue.textContent = currency(totals.subtotal);
  elements.markupValue.textContent = currency(totals.markup);
  elements.discountAmountValue.textContent = currency(totals.discount);
  elements.grandTotalValue.textContent = currency(totals.total);

  if (state.quote.lines.length === 0) {
    elements.quoteLines.innerHTML = '<div class="empty-state">Add a product to start building the quote.</div>';
    return;
  }

  elements.quoteLines.innerHTML = state.quote.lines
    .map((line, index) => {
      const grossMultiplier = 1 + totals.markupPercent / 100;
      const lineGross = roundMoney(line.unit_price_zar * line.quantity * grossMultiplier);
      return `
        <article class="quote-line-card">
          <header>
            <div>
              <strong>${escapeHtml(line.code || line.system_name)}</strong>
              <p>${escapeHtml(line.description)}</p>
            </div>
            <strong>${currency(lineGross)}</strong>
          </header>
          <footer>
            <span>${escapeHtml(line.quantity)} x ${escapeHtml(line.system_name)} | ${line.run_length_m ? `${line.run_length_m}m` : `${line.width_mm || "-"} x ${line.height_mm || "-"} mm`}</span>
            <span>
              <button class="ghost-button" type="button" data-action="edit-line" data-line="${index}">Edit</button>
              <button class="ghost-button" type="button" data-action="remove-line" data-line="${index}">Delete</button>
            </span>
          </footer>
        </article>
      `;
    })
    .join("");

  elements.quoteLines.querySelectorAll("[data-action='edit-line']").forEach((button) => {
    button.addEventListener("click", () => editQuoteLine(Number(button.dataset.line)));
  });
  elements.quoteLines.querySelectorAll("[data-action='remove-line']").forEach((button) => {
    button.addEventListener("click", () => {
      state.quote.lines.splice(Number(button.dataset.line), 1);
      renderQuoteWorkspace();
      showToast("Product removed from quote.");
    });
  });
}

function editQuoteLine(index) {
  const line = state.quote.lines[index];
  if (!line) {
    return;
  }
  state.currentEditIndex = index;
  state.currentCalculation = null;
  setActiveTab("builder");
  setWorkspaceVisible(true);
  switchMode("manual");
  elements.productCode.value = line.code || "";
  elements.systemGroup.value = line.system_group;
  populateSystemSelect(line.system_group, line.system_name);
  elements.quantity.value = String(line.quantity);
  elements.widthMm.value = line.width_mm ?? "";
  elements.heightMm.value = line.height_mm ?? "";
  elements.runLength.value = line.run_length_m ?? "";
  elements.glassCode.value = line.glass_code;
  elements.frameColour.value = line.frame_colour;
  elements.hardwareColour.value = line.hardware_colour;
  elements.hingeType.value = line.hinge_type || elements.hingeType.value;
  elements.panelCount.value = line.panel_count || elements.panelCount.value;
  elements.leafCount.value = line.leaf_count || elements.leafCount.value;
  elements.doorType.value = line.door_type || elements.doorType.value;
  elements.doorQuantity.value = line.door_quantity || "1";
  elements.editStatePill.textContent = "Editing existing product";
  elements.addToQuote.textContent = "Update Quote";
  elements.addToQuote.disabled = true;
  renderCalculationPreview();
  showToast("Product loaded back into the builder. Recalculate before saving the update.");
}

function computeQuoteTotals() {
  const subtotal = roundMoney(
    state.quote.lines.reduce((sum, line) => sum + line.unit_price_zar * line.quantity, 0),
  );
  const markupPercent = Number(elements.quoteMarkup.value || 0);
  const markup = roundMoney(subtotal * (markupPercent / 100));
  const gross = subtotal + markup;
  const discountType = elements.discountType.value;
  const discountValue = Number(elements.discountValue.value || 0);
  const discount = roundMoney(discountType === "percent" ? gross * (discountValue / 100) : discountValue);
  const total = roundMoney(Math.max(gross - discount, 0));
  state.quote.markup_percent = markupPercent;
  state.quote.discount_type = discountType;
  state.quote.discount_value = discountValue;
  return { subtotal, markupPercent, markup, discount, total };
}

function syncQuoteHeaderToState() {
  state.quote.quote_number = elements.quoteNumber.value.trim();
  state.quote.customer_name = elements.customerName.value.trim();
  state.quote.phone_number = elements.phoneNumber.value.trim();
  state.quote.address = elements.address.value.trim();
  state.quote.salesperson = elements.salesperson.value.trim();
  state.quote.installer = elements.installer.value.trim();
  state.quote.notes = elements.notes.value.trim();
}

async function saveQuote() {
  syncQuoteHeaderToState();
  if (!state.quote.customer_name) {
    showToast("Customer name is required before the quote can be saved.");
    return;
  }
  if (state.quote.lines.length === 0) {
    showToast("Add at least one product before saving the quote.");
    return;
  }

  const payload = {
    id: state.quote.id,
    quote_number: state.quote.quote_number || null,
    customer_name: state.quote.customer_name,
    phone_number: state.quote.phone_number || null,
    address: state.quote.address || null,
    salesperson: state.quote.salesperson || null,
    installer: state.quote.installer || null,
    notes: state.quote.notes || null,
    currency: "ZAR",
    markup_percent: Number(elements.quoteMarkup.value || 20),
    discount_type: elements.discountType.value,
    discount_value: Number(elements.discountValue.value || 0),
    lines: state.quote.lines,
  };

  try {
    const saved = await fetchJson("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    loadQuoteIntoWorkspace(saved);
    await loadRecentQuotes();
    showToast(`Quote ${saved.quote_number} saved successfully.`);
  } catch (error) {
    showToast(error.message || "Unable to save the quote.");
  }
}

async function loadRecentQuotes(query = "") {
  try {
    const url = query ? `/api/quotes?q=${encodeURIComponent(query)}` : "/api/quotes";
    const quotes = await fetchJson(url);
    if (!quotes.length) {
      elements.recentQuotes.innerHTML = '<div class="empty-state">No saved quotes found.</div>';
      return;
    }
    elements.recentQuotes.innerHTML = quotes
      .map(
        (quote) => `
          <article class="quote-card">
            <header>
              <div>
                <strong>${escapeHtml(quote.quote_number)}</strong>
                <p>${escapeHtml(quote.customer_name)}</p>
              </div>
              <strong>${currency(quote.total_zar)}</strong>
            </header>
            <footer>
              <span>${new Date(quote.created_at).toLocaleString()} | ${quote.line_count} lines</span>
              <button class="secondary-button" type="button" data-action="load-quote" data-id="${quote.id}">Load Quote</button>
            </footer>
          </article>
        `,
      )
      .join("");

    elements.recentQuotes.querySelectorAll("[data-action='load-quote']").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const quote = await fetchJson(`/api/quotes/${button.dataset.id}`);
          loadQuoteIntoWorkspace(quote);
          showToast(`Quote ${quote.quote_number} loaded into the workspace.`);
        } catch (error) {
          showToast(error.message || "Unable to load the selected quote.");
        }
      });
    });
  } catch (error) {
    elements.recentQuotes.innerHTML = '<div class="empty-state">Recent quotes could not be loaded.</div>';
  }
}

function loadQuoteIntoWorkspace(quote) {
  state.quote = {
    id: quote.id,
    quote_number: quote.quote_number,
    customer_name: quote.customer_name,
    phone_number: quote.phone_number || "",
    address: quote.address || "",
    salesperson: quote.salesperson || "",
    installer: quote.installer || "",
    notes: quote.notes || "",
    markup_percent: Number(quote.markup_percent || 20),
    discount_type: quote.discount_type || "amount",
    discount_value: Number(quote.discount_value || 0),
    lines: quote.lines.map((line) => ({
      ...line,
      unit_price_zar: Number(line.unit_price_zar),
      quantity: Number(line.quantity),
    })),
  };

  elements.quoteNumber.value = state.quote.quote_number;
  elements.customerName.value = state.quote.customer_name;
  elements.phoneNumber.value = state.quote.phone_number;
  elements.address.value = state.quote.address;
  elements.salesperson.value = state.quote.salesperson;
  elements.installer.value = state.quote.installer;
  elements.notes.value = state.quote.notes;
  elements.quoteMarkup.value = state.quote.markup_percent;
  elements.discountType.value = state.quote.discount_type;
  elements.discountValue.value = state.quote.discount_value;
  state.uploadedFileName = "";
  state.extractionSummary = `Loaded quote ${quote.quote_number} into the builder.`;
  renderHeroStatus();
  setActiveTab("builder");
  setWorkspaceVisible(true);
  renderQuoteWorkspace();
}

function openQuotePreview(shouldPrint) {
  syncQuoteHeaderToState();
  if (!state.quote.customer_name || state.quote.lines.length === 0) {
    showToast("Add customer details and at least one product before previewing the quote.");
    return;
  }

  const totals = computeQuoteTotals();
  const previewWindow = window.open("", "_blank", "width=1100,height=900");
  if (!previewWindow) {
    showToast("The preview window was blocked by the browser.");
    return;
  }

  const markupFactor = 1 + totals.markupPercent / 100;
  const lineRows = state.quote.lines
    .map((line) => {
      const lineTotal = roundMoney(line.unit_price_zar * line.quantity * markupFactor);
      return `
        <tr>
          <td>${escapeHtml(line.code || line.system_name)}</td>
          <td>${escapeHtml(line.description)}</td>
          <td>${escapeHtml(String(line.quantity))}</td>
          <td>${currency(roundMoney(line.unit_price_zar * markupFactor))}</td>
          <td>${currency(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  previewWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(state.quote.quote_number || "Front of House Calculator-1 Preview")}</title>
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        <main class="preview-document">
          <header>
            <div>
              <p class="eyebrow">Anglo Windows</p>
              <h1>Mini Quote</h1>
              <p class="muted">Professional reception quote generated from Front of House Calculator-1.</p>
            </div>
            <div>
              <strong>${escapeHtml(state.quote.quote_number || "Pending save")}</strong>
              <p class="muted">${new Date().toLocaleDateString()}</p>
            </div>
          </header>

          <section class="card section-card">
            <div class="grid-form">
              <div>
                <strong>Customer</strong>
                <p>${escapeHtml(state.quote.customer_name)}</p>
              </div>
              <div>
                <strong>Phone</strong>
                <p>${escapeHtml(state.quote.phone_number || "-")}</p>
              </div>
              <div>
                <strong>Address</strong>
                <p>${escapeHtml(state.quote.address || "-")}</p>
              </div>
              <div>
                <strong>Salesperson</strong>
                <p>${escapeHtml(state.quote.salesperson || "-")}</p>
              </div>
            </div>
          </section>

          <section class="card section-card" style="margin-top: 20px;">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>${lineRows}</tbody>
            </table>
            <div class="summary-strip">
              <div><span>Subtotal</span><strong>${currency(totals.subtotal)}</strong></div>
              <div><span>Markup</span><strong>${currency(totals.markup)}</strong></div>
              <div><span>Discount</span><strong>${currency(totals.discount)}</strong></div>
              <div><span>Total</span><strong>${currency(totals.total)}</strong></div>
            </div>
          </section>
        </main>
      </body>
    </html>
  `);
  previewWindow.document.close();

  if (shouldPrint) {
    previewWindow.focus();
    previewWindow.print();
  }
}

function emailQuote() {
  syncQuoteHeaderToState();
  if (!state.quote.customer_name || state.quote.lines.length === 0) {
    showToast("Build the quote first so the email includes meaningful details.");
    return;
  }
  const totals = computeQuoteTotals();
  const subject = encodeURIComponent(`Front of House Quote ${state.quote.quote_number || ""}`.trim());
  const body = encodeURIComponent(
    [
      `Dear ${state.quote.customer_name},`,
      "",
      "Please find your Front of House Calculator-1 mini quote summary below.",
      "",
      `Quote Number: ${state.quote.quote_number || "Pending save"}`,
      `Total: ${currency(totals.total)}`,
      "",
      "A PDF version can be exported from the calculator and attached before sending.",
      "",
      "Kind regards,",
      state.quote.salesperson || "Anglo Windows Reception Desk",
    ].join("\n"),
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function fillSelect(element, options) {
  element.innerHTML = options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || `Request failed with status ${response.status}`);
  }
  return response.json();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 3800);
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return Number(value);
}

function toNullableInt(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return Number.parseInt(value, 10);
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function currency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function labelForGroup(groupId) {
  return state.catalog.groups.find((group) => group.id === groupId)?.name || groupId;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), delay);
  };
}
