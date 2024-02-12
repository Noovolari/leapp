## How to export your Pro Workspace

1. create a backup of your ~/.Leapp/Leapp-lock.json file;
   ```shell
   // From ~/.Leapp directory run the following command:
   cp Leapp-lock.json Leapp-lock.json.bkp
   ```
2. log into you Pro Workspace using the Desktop App;
   ![](../../images/tutorials/export-pro-workspace/export-pro-workspace-2.png?style=center-img)
3. from the Leapp Options "General" tab, click the button next to the "Export Pro/Team workspace" label;
   ![](../../images/tutorials/export-pro-workspace/export-pro-workspace.png?style=center-img)
4. close the Leapp Options dialog;
5. close Leapp (on macOS ⌘+Q);
5. you should see a **Leapp-lock.json.exported** file in the ~/.Leapp folder;
6. remove the Leapp-lock.json file and rename Leapp-lock.json.exported to Leapp-lock.json;
   ```shell
   rm Leapp-lock.json
   mv Leapp-lock.json.exported Leapp-lock.json
   ```
7. re-open Leapp;
8. switch to the Local Workspace; 
9. you should now see your Pro Workspace migrated into the Local one.
