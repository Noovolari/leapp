This section provides an overview of Leapp’s plugins, which can be used to extend the functionality of Leapp.

Plugins are commonly used when more advanced and custom behavior is needed, for example using Leapp-generated temporary credentials to run custom actions.

You can create your own plugins or import custom ones created by the community. You can also publish your plugins on npm to make them available to everyone easily.

##Add a Plugin

To add a plugin you can use one of the following methods:

###Add from npm

From the Leapp option menu, go to the Plugins tab. Insert the name of the npm package for the plugin and click on the plus icon to add it to your plugins

![](../../images/plugin-system/screen2.png?style=smaller-img)

###Add manually

Go to Options by clicking the top right gear icon then click the Plugins tab. Click the Folder Icon. This will open the plugin folder inside .Leapp. 

Here, manually create a folder with the same name as your plugin package.json name property and move your `package.json` and bundled `plugin.js` files inside this folder.

Alternatively, you can simply move your entire plugin folder cloned from the [example template](/plugins/plugins-development/#starting-template).

Lastly, from the Leapp Plugins tab in the Option menu, click on the refresh icon to reload all plugins.

![](../../images/plugin-system/screen3.png?style=even-smaller-img)

!!! Warning

    Adding plugins is at your own risk! We cannot currently guarantee that a plugin is safe, so BE CAREFUL when you install something from an unknown source. 
    A plugin verification system is under development and will be available later this year.

##Disable a Plugin

To disable a Leapp plugin, go to Options by clicking the top right gear icon then click the Plugins tab. 

Toggle Enabled for the plugin you want to disable.

##Remove a Plugin

To remove a Leapp plugin, go to Options by clicking the top right gear icon then click the Plugins tab. 

Click the Folder Icon. This will open the plugin folder inside .Leapp. 
From here, locate the folder containing the plugin you want to remove and simply delete the folder.

##Run a Plugin

You can run a plugin both from Leapp Desktop App and Leapp CLI.

From Leapp Desktop App, right click on a session to open the contextual menu, click on Plugins, and select the plugin you want to run

![](../../images/plugin-system/screen4.png?style=smaller-img)

!!! Info

    This contextual menu option is not available if you have no plugins that you can run on the selected session and/or your operating system.

From Leapp CLI, you can use the command `leapp session run-plugin`. For more information on how to use this CLI command, see the [documentation]()

##Plugin Menu

Click on the top right gear icon to go to the Leapp option menu and then select the tab Plugin.

From there, you can see a list of currently installed plugins, check whether a plugin is compatible with your system or not, which session types it supports and disable/enable it if you need.

![](../../images/plugin-system/screen1.png?style=smaller-img)

##Create your Plugin

You can start creating a plugin [from the template](https://github.com/Noovolari/leapp-plugin-template).

Leapp plugins are written in TypeScript. They must contain at least a class that extend sa base class provided by the Plugin SDK

There's currently only one of these classes, `AwsCredentialsPlugin` , that can be used to create a plugin that generates temporary credentials.

Every Leapp plugin must at least have a `package.json` file and a `plugin.js` file.

```
leapp-plugin/             
 ├── package.json      # Plugin metadata
 └── plugin.js         # A webpack bundle for the main logic
```

[Create your Plugin](https://github.com/Noovolari/leapp-plugin-template){ .md-button .md-button--primary .centered-button}

