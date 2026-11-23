// The five dialogs that mixed [(ngModel)] with reactive form directives keep their behaviour with
// the FormControl as the only binding. The real components and the real OptionsService run against an in-memory
// core (a real Workspace model); the user's choices go through the rendered ng-select / mat-checkbox controls.
import { constants } from "@noovolari/leapp-core/models/constants";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamUserSession } from "@noovolari/leapp-core/models/aws/aws-iam-user-session";
import { AwsIamRoleChainedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-chained-session";
import { IntegrationType } from "@noovolari/leapp-core/models/integration-type";
import { OptionsDialogComponent } from "./options-dialog/options-dialog.component";
import { CreateDialogComponent } from "./create-dialog/create-dialog.component";
import { EditDialogComponent } from "./edit-dialog/edit-dialog.component";
import { SegmentDialogComponent } from "./segment-dialog/segment-dialog.component";
import { IntegrationBarComponent } from "../integration-bar/integration-bar.component";
import {
  FakeCore,
  Harness,
  settle,
  configure,
  ngSelect,
  shown,
  pick,
  openTab,
  checkbox,
  deprecations,
  nativeOf,
} from "../../testing/dialog-test-kit";

afterEach(() => {
  document.querySelectorAll(".ng-dropdown-panel").forEach((panel) => panel.remove());
});

describe("Options dialog", () => {
  const storedOptions = (core: FakeCore): void => {
    const workspace = core.workspace as any;
    workspace.defaultRegion = "eu-west-1";
    workspace.defaultLocation = "westeurope";
    workspace.macOsTerminal = constants.macOsIterm2;
    workspace.colorTheme = constants.darkTheme;
    workspace.credentialMethod = constants.credentialFile;
    workspace.ssmRegionBehaviour = constants.ssmRegionDefault;
    workspace.requirePassword = constants.requirePasswordEveryMonth.value;
    workspace.touchIdEnabled = false;
    workspace.proxyConfiguration = { proxyProtocol: "HTTP", proxyUrl: undefined, proxyPort: "8080", username: "", password: "" };
  };

  it("shows the stored options on open", async () => {
    const harness = await configure(OptionsDialogComponent, { before: storedOptions });
    const root = nativeOf(harness);
    expect(shown(root, "regionsSelect")).toBe("eu-west-1");
    expect(shown(root, "locationsSelect")).toBe("westeurope");
    expect(shown(root, "terminalSelect")).toBe("iTerm2");
    expect(shown(root, "colorThemeSelect")).toBe("Dark Theme");
    expect(shown(root, "credentialMethodSelect")).toBe("credential-file-method");
    expect(shown(root, "requirePasswordSelect")).toBe("Every month");
    expect(shown(root, "proxyProtocol")).toBe("HTTP");
    expect(checkbox(root, "touchIdEnableSelect").checked).toBe(false);
    expect(checkbox(root, "showAuthCheckbox").checked).toBe(false);
    await openTab(harness.fixture, "SSM");
    expect(shown(root, "ssmRegionBehaviourSelect")).toBe("Use default region");
  });

  it("Done stores the values picked in every control", async () => {
    const harness = await configure(OptionsDialogComponent, { before: storedOptions });
    const { fixture, core } = harness;
    const root = nativeOf(harness);
    await pick(fixture, root, "regionsSelect", "eu-central-1");
    await pick(fixture, root, "locationsSelect", "northeurope");
    await pick(fixture, root, "terminalSelect", "Warp");
    await pick(fixture, root, "colorThemeSelect", "Light Theme");
    await pick(fixture, root, "requirePasswordSelect", "Never");
    await pick(fixture, root, "proxyProtocol", "HTTPS");
    checkbox(root, "touchIdEnableSelect").click();
    await settle(fixture);
    await openTab(fixture, "SSM");
    await pick(fixture, root, "ssmRegionBehaviourSelect", "No");

    await harness.component.saveOptions();

    const workspace = core.workspace as any;
    expect(workspace.defaultRegion).toBe("eu-central-1");
    expect(workspace.defaultLocation).toBe("northeurope");
    expect(workspace.macOsTerminal).toBe("Warp");
    expect(workspace.colorTheme).toBe("Light Theme");
    expect(workspace.ssmRegionBehaviour).toBe("No");
    expect(workspace.requirePassword).toBe(999999);
    expect(workspace.touchIdEnabled).toBe(true);
    expect(workspace.proxyConfiguration.proxyProtocol).toBe("HTTPS");
    expect(harness.closeModal).toHaveBeenCalled();
  });

  it("the proxy user and password show only while the auth checkbox is ticked", async () => {
    const harness = await configure(OptionsDialogComponent, { before: storedOptions });
    const root = nativeOf(harness);
    expect(root.querySelector('[formcontrolname="proxyUsername"]')).toBeNull();
    checkbox(root, "showAuthCheckbox").click();
    await settle(harness.fixture);
    expect(root.querySelector('[formcontrolname="proxyUsername"]')).not.toBeNull();
    expect(root.querySelector('[formcontrolname="proxyPassword"]')).not.toBeNull();
    checkbox(root, "showAuthCheckbox").click();
    await settle(harness.fixture);
    expect(root.querySelector('[formcontrolname="proxyUsername"]')).toBeNull();
  });

  it("Cancel on the credential-process warning moves the select back to the file method", async () => {
    const harness = await configure(OptionsDialogComponent, { before: storedOptions });
    const root = nativeOf(harness);
    await pick(harness.fixture, root, "credentialMethodSelect", "credential-process-method");
    expect(harness.modal.shown.length).toBe(1);
    await harness.modal.shown[0].options.initialState.callback(constants.confirmClosed);
    await settle(harness.fixture);
    expect(shown(root, "credentialMethodSelect")).toBe("credential-file-method");
    expect((harness.core.workspace as any).credentialMethod).toBe("credential-file-method");
  });

  it("I acknowledge it stores the credential-process method", async () => {
    const harness = await configure(OptionsDialogComponent, { before: storedOptions });
    const root = nativeOf(harness);
    await pick(harness.fixture, root, "credentialMethodSelect", "credential-process-method");
    await harness.modal.shown[0].options.initialState.callback(constants.confirmed);
    await settle(harness.fixture);
    expect(shown(root, "credentialMethodSelect")).toBe("credential-process-method");
    expect((harness.core.workspace as any).credentialMethod).toBe("credential-process-method");
  });

  it("opening and using the Options dialog logs no form deprecation warning", async () => {
    const harness = await configure(OptionsDialogComponent, { before: storedOptions });
    const root = nativeOf(harness);
    await pick(harness.fixture, root, "regionsSelect", "eu-south-1");
    checkbox(root, "showAuthCheckbox").click();
    await settle(harness.fixture);
    expect(deprecations(harness.warnings)).toEqual([]);
  });
});

describe("Create dialog", () => {
  /** Clicks the "Amazon AWS" provider card, as the user does. */
  const chooseAws = async (harness: Harness<CreateDialogComponent>): Promise<void> => {
    const card = (Array.from(nativeOf(harness).querySelectorAll("button.providers")) as HTMLElement[]).find((button) =>
      button.textContent.includes("Amazon AWS")
    );
    card.click();
    await settle(harness.fixture);
  };

  const withParent = (core: FakeCore): AwsIamUserSession => {
    (core.workspace as any).defaultRegion = "eu-west-1";
    const parent = new AwsIamUserSession("Parent", "eu-central-1", core.workspace.profiles[0].id);
    core.workspace.sessions = [parent];
    return parent;
  };

  it("the access method starts at Federated and switches the fields; the region starts at the default", async () => {
    const harness = await configure(CreateDialogComponent, { before: withParent });
    await chooseAws(harness);
    const root = nativeOf(harness);
    expect(shown(root, "selectAccessStrategy")).toBe("AWS IAM Role Federated");
    expect(root.querySelector('[formcontrolname="idpArn"]')).not.toBeNull();
    expect(shown(root, "awsRegion")).toBe("eu-west-1");

    await pick(harness.fixture, root, "selectAccessStrategy", "AWS IAM User");
    expect(root.querySelector('[formcontrolname="accessKey"]')).not.toBeNull();
    expect(root.querySelector('[formcontrolname="idpArn"]')).toBeNull();
  });

  it("an IAM user is created with the picked region", async () => {
    const harness = await configure(CreateDialogComponent, { before: withParent });
    await chooseAws(harness);
    const root = nativeOf(harness);
    await pick(harness.fixture, root, "selectAccessStrategy", "AWS IAM User");
    await pick(harness.fixture, root, "awsRegion", "eu-south-1");
    harness.component.form.controls["name"].setValue("New User");
    harness.component.form.controls["accessKey"].setValue("AKIATESTTESTTESTTEST");
    harness.component.form.controls["secretKey"].setValue("test-secret-value");

    await harness.component.saveSession();

    expect(harness.core.created.map((c) => [c.type, c.request.sessionName, c.request.region]))
      .withContext(`toasts: ${harness.toasts().join(" | ")}`)
      .toEqual([[SessionType.awsIamUser, "New User", "eu-south-1"]]);
  });

  it("Create Chained Session pre-fills the parent's region and the parent as assumer, and saves them", async () => {
    let parent: AwsIamUserSession;
    const harness = await configure(CreateDialogComponent, {
      before: (core) => (parent = withParent(core)),
      inputs: () =>
        ({
          shortcut: true,
          shortcutAlias: "ChainedFromParent",
          shortcutRegion: "eu-central-1",
          shortcutSessionId: parent.sessionId,
          shortcutSessionTag: "chained-from-Parent",
        } as any),
    });
    const root = nativeOf(harness);
    expect(shown(root, "awsRegion")).toBe("eu-central-1");
    expect(shown(root, "assumerSession")).toBe("Parent");

    harness.component.form.controls["roleArn"].setValue("arn:aws:iam::000000000000:role/qa");
    await harness.component.saveSession();

    expect(harness.core.created.map((c) => [c.type, c.request.region, c.request.parentSessionId]))
      .withContext(`toasts: ${harness.toasts().join(" | ")}`)
      .toEqual([[SessionType.awsIamRoleChained, "eu-central-1", parent.sessionId]]);
  });

  it("opening and using the Create dialog logs no form deprecation warning", async () => {
    const harness = await configure(CreateDialogComponent, { before: withParent });
    await chooseAws(harness);
    await pick(harness.fixture, nativeOf(harness), "selectAccessStrategy", "AWS IAM Role Chained");
    await pick(harness.fixture, nativeOf(harness), "assumerSession", "Parent");
    expect(deprecations(harness.warnings)).toEqual([]);
  });
});

describe("Edit dialog", () => {
  const sessions = (core: FakeCore): { user: AwsIamUserSession; other: AwsIamUserSession; chained: AwsIamRoleChainedSession } => {
    const profileId = core.workspace.profiles[0].id;
    const user = new AwsIamUserSession("User", "eu-west-1", profileId);
    const other = new AwsIamUserSession("Other", "us-east-1", profileId);
    const chained = new AwsIamRoleChainedSession("Chained", "eu-central-1", "arn:aws:iam::000000000000:role/qa", profileId, user.sessionId, "tag");
    core.workspace.sessions = [user, other, chained];
    core.keychain.set(`${user.sessionId}-iam-user-aws-session-access-key-id`, "AKIATESTTESTTESTTEST");
    core.keychain.set(`${user.sessionId}-iam-user-aws-session-secret-access-key`, "test-secret-value");
    return { user, other, chained };
  };

  it("an IAM user opens with its region and saves the new one", async () => {
    let user: AwsIamUserSession;
    const harness = await configure(EditDialogComponent, {
      before: (core) => ({ user } = sessions(core)),
      inputs: () => ({ selectedSessionId: user.sessionId } as any),
    });
    const root = nativeOf(harness);
    expect(shown(root, "awsRegion")).toBe("eu-west-1");

    await pick(harness.fixture, root, "awsRegion", "eu-south-1");
    await harness.component.saveAccount();

    expect(harness.core.workspace.sessions.find((s) => s.sessionId === user.sessionId).region)
      .withContext(`toasts: ${harness.toasts().join(" | ")}`)
      .toBe("eu-south-1");
  });

  it("a chained session opens with its assumer and saves the new region and assumer", async () => {
    let chained: AwsIamRoleChainedSession;
    let other: AwsIamUserSession;
    const harness = await configure(EditDialogComponent, {
      before: (core) => ({ chained, other } = sessions(core)),
      inputs: () => ({ selectedSessionId: chained.sessionId } as any),
    });
    const root = nativeOf(harness);
    expect(shown(root, "awsRegion")).toBe("eu-central-1");
    expect(shown(root, "assumerSession")).toBe("User");

    await pick(harness.fixture, root, "awsRegion", "eu-west-1");
    await pick(harness.fixture, root, "assumerSession", "Other");
    await harness.component.saveAccount();

    const saved = harness.core.workspace.sessions.find((s) => s.sessionId === chained.sessionId) as AwsIamRoleChainedSession;
    expect([saved.region, saved.parentSessionId])
      .withContext(`toasts: ${harness.toasts().join(" | ")}`)
      .toEqual(["eu-west-1", other.sessionId]);
  });

  it("opening and using the Edit dialog logs no form deprecation warning", async () => {
    let chained: AwsIamRoleChainedSession;
    const harness = await configure(EditDialogComponent, {
      before: (core) => ({ chained } = sessions(core)),
      inputs: () => ({ selectedSessionId: chained.sessionId } as any),
    });
    await pick(harness.fixture, nativeOf(harness), "awsRegion", "eu-south-1");
    expect(deprecations(harness.warnings)).toEqual([]);
  });
});

describe("Integration form", () => {
  const modalRoot = (): HTMLElement => document.querySelector(".sso-modal") as HTMLElement;

  afterEach(() => document.querySelectorAll("modal-container, .modal-backdrop").forEach((node) => node.remove()));

  it("a new integration starts at AWS SSO and saves the picked region and browser opening", async () => {
    const harness = await configure(IntegrationBarComponent, { realModal: true });
    harness.component.gotoForm(1, harness.component.selectedConfiguration);
    await settle(harness.fixture);
    expect(shown(modalRoot(), "integrationType")).toBe("AWS Single Sign-On");

    await pick(harness.fixture, modalRoot(), "awsRegion", "eu-south-1");
    await pick(harness.fixture, modalRoot(), "defaultBrowserOpening", "In-browser");
    harness.component.form.get("alias").setValue("QA SSO");
    harness.component.form.get("portalUrl").setValue("https://d-0000000000.awsapps.com/start");
    await harness.component.save();

    expect(harness.core.integrationsCreated).toEqual([
      {
        type: IntegrationType.awsSso,
        params: { alias: "QA SSO", browserOpening: "In-browser", portalUrl: "https://d-0000000000.awsapps.com/start", region: "eu-south-1" },
      },
    ]);
  });

  it("editing opens with the integration's values and saves the new region and browser opening", async () => {
    const harness = await configure(IntegrationBarComponent, { realModal: true });
    const integration = {
      id: "integration-1",
      type: IntegrationType.awsSso,
      alias: "Existing",
      portalUrl: "https://d-1111111111.awsapps.com/start",
      region: "eu-west-1",
      browserOpening: constants.inApp,
      accessTokenExpiration: undefined,
      tenantId: "",
    };
    harness.component.gotoForm(2, integration as any);
    await settle(harness.fixture);
    expect(shown(modalRoot(), "awsRegion")).toBe("eu-west-1");
    expect(shown(modalRoot(), "defaultBrowserOpening")).toBe("In-app");

    await pick(harness.fixture, modalRoot(), "awsRegion", "eu-central-1");
    await pick(harness.fixture, modalRoot(), "defaultBrowserOpening", "In-browser");
    await harness.component.save();

    expect(harness.core.integrationsUpdated).toEqual([
      {
        id: "integration-1",
        params: { alias: "Existing", browserOpening: "In-browser", portalUrl: "https://d-1111111111.awsapps.com/start", region: "eu-central-1" },
      },
    ]);
  });

  it("opening and using the integration form logs no form deprecation warning", async () => {
    const harness = await configure(IntegrationBarComponent, { realModal: true });
    harness.component.gotoForm(1, harness.component.selectedConfiguration);
    await settle(harness.fixture);
    await pick(harness.fixture, modalRoot(), "awsRegion", "eu-south-1");
    expect(deprecations(harness.warnings)).toEqual([]);
  });
});

describe("Segment dialog", () => {
  const existing = (core: FakeCore): void => {
    core.segments = [{ name: "Mine", filterGroup: { searchFilter: "old" } }];
  };

  it("saving with an existing name overwrites that segment", async () => {
    const harness = await configure(SegmentDialogComponent, { before: existing });
    (harness.component as any).currentFilterGroup = { searchFilter: "new" };
    await pick(harness.fixture, nativeOf(harness), "segmentName", "Mine");
    harness.component.saveSegment();
    expect(harness.core.segments).toEqual([{ name: "Mine", filterGroup: { searchFilter: "new" } }]);
  });

  it("saving with a new name adds a segment with the current filters", async () => {
    const harness = await configure(SegmentDialogComponent, { before: existing });
    (harness.component as any).currentFilterGroup = { searchFilter: "fresh" };
    const select = ngSelect(nativeOf(harness), "segmentName");
    select.querySelector(".ng-select-container").dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    const input = select.querySelector("input") as HTMLInputElement;
    input.value = "Fresh";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "h" }));
    await settle(harness.fixture);
    // "Add "Fresh"" adds the name to the list; the user then picks it, as in the app
    (document.querySelector(".ng-dropdown-panel .create-new.add") as HTMLElement).click();
    await settle(harness.fixture);
    await pick(harness.fixture, nativeOf(harness), "segmentName", "Fresh");
    harness.component.saveSegment();
    expect(harness.core.segments.map((segment) => segment.name)).toEqual(["Mine", "Fresh"]);
    expect(harness.core.segments[1].filterGroup).toEqual({ searchFilter: "fresh" });
  });

  it("opening and using the Segment dialog logs no form deprecation warning", async () => {
    const harness = await configure(SegmentDialogComponent, { before: existing });
    await pick(harness.fixture, nativeOf(harness), "segmentName", "Mine");
    expect(deprecations(harness.warnings)).toEqual([]);
  });
});
