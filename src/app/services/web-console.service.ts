import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';


@Injectable({
  providedIn: 'root'
})
export class WebConsoleService extends NativeService {

  constructor() {
    super();
  }

  openIsolateWebConsole(contextName, url) {
    const consoleWindow = new this.browserWindow({
      width: 1000,
      height: 600,
      webPreferences: {
        partition: contextName
      }
    });
    consoleWindow.maximize();
    consoleWindow.loadURL(url);
    return consoleWindow;
  }
}
