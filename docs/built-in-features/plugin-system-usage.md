##Plugin menu

Click on the top right gear icon to go to the Leapp option menu and then select the tab Plugin.

From there, you can see a list of currently installed plugins, check whether a plugin is compatible with your system or not, which session types it supports and disable/enable it if you need.

You can also click on the folder icon to open the plugin directory in your system explorer or the refresh icon to reload all plugins, which is useful when manually loading plugins or if you're developing them.

Finally, you can insert the name of a Leapp plugin from npm in the form field to quickly install it [(see next section)](/built-in-features/plugin-system-usage/#install-from-npm).

![](../../images/plugin-system/screen1.png?style=smaller-img)

##Install a Plugin

Inside the .Leapp folder, (to locate it, see [Application Data](../../troubleshooting/app-data/)) there is now a folder called `plugins`.
This folder contains all the plugins installed by the user.

To install a plugin you can use one of the following methods:

###Install from npm

You can [publish](/built-in-features/plugin-system-documentation/#how-to-publish) your plugins on npm and use it to store and retrieve them.

From the Leapp option menu, go to the Plugin tab. Insert the name of the npm package and click on the plus icon to add it to your plugins

![](../../images/plugin-system/screen2.png?style=smaller-img)

###Install manually

Go to the `plugins` folder inside .Leapp.

Once you're here, manually create a folder using the same name as your plugin package.json name property.

Inside this other folder, you can move your package.json and bundled plugin.js files.

Alternatively, you can simply move your entire plugin folder cloned from the [example template](/built-in-features/plugin-system-documentation/#starting-template).

![](../../images/plugin-system/screen3.png?style=even-smaller-img)

!!! Warning

    Installing a plugin is at your own risk! We cannot currently guarantee that a plugin is safe, so BE CAREFUL when you install something from an unknown source. 
    A plugin verification system is under development and will be available later this year.

##Run a Plugin

You can run a plugin both from Leapp Desktop App and Leapp CLI.

From Leapp Desktop App, right click on a session to open the contextual menu, click on Plugins, and select the plugin you want to run

![](../../images/plugin-system/screen4.png?style=smaller-img)

!!! Info

    This contextual menu option is not available if you have no plugins that you can run on the selected session and/or your operating system.

From Leapp CLI, you can use the command `leapp session run-plugin`. For more information on how to use this CLI command, see the [documentation]()
