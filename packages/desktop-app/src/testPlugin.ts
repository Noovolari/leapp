import { Session } from "@noovolari/leapp-core/models/session";
import { PluginCoreService } from "@noovolari/leapp-core/plugin-system/plugin-core-service";
import { IPlugin } from "@noovolari/leapp-core/plugin-system/interfaces/IPlugin";

export class HelloWorldPlugin implements IPlugin {
  active: boolean;
  author = "Alessandro Gaggia";
  description = "hello world plugin";
  name = "Hello World";
  supportedOS = ["macOS", "windows", "linux"];
  tags = ["leapp-plugin", "hello world"];
  templateStructure;
  url: string;

  private helloWorldMessage;
  private session;
  private pluginCoreService;

  boostrap(session: Session, pluginCoreService: PluginCoreService): any {
    this.session = session;
    this.pluginCoreService = pluginCoreService;
    this.templateStructure = { form: [], output: { type: pluginCoreService.outputType.message, data: "myHelloWorldMessage" } };
  }

  applyAction(): any {
    this.helloWorldMessage = "Hello from plugin TestPlugin with session: " + this.session.sessionName;
  }

  myHelloWorldMessage(): string {
    return this.helloWorldMessage;
  }
}
