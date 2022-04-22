import { AccessMethod } from "./access-method";
import { AccessMethodField } from "./access-method-field";
import { AccessMethodFieldType } from "./access-method-field-type";
import { SessionType } from "./session-type";

describe("accessMethod", () => {
  it("getSessionCreationRequest", () => {
    const fieldValues = new Map<string, string>([
      ["macchina", "Clio"],
      ["cibo", "pizza"],
      ["sessionName", "prova"],
    ]);
    const accessMethod = new AccessMethod(
      SessionType.azure,
      "azure session",
      [
        new AccessMethodField("macchina", "message1", AccessMethodFieldType.input),
        new AccessMethodField("cibo", "message1", AccessMethodFieldType.input),
        new AccessMethodField("sessionName", "message1", AccessMethodFieldType.input),
      ],
      true
    );
    const actualRequest = accessMethod.getSessionCreationRequest(fieldValues);
    expect(actualRequest).toEqual({
      cibo: "pizza",
      macchina: "Clio",
      sessionName: "prova",
    });
  });
});
