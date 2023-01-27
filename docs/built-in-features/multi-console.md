---
title: "Configure Multi Console"
description: "How to configure Multi Console. The Leapp Multi-Console Browser Extension allows you to open **multiple instances of the AWS Web Console in the same browser window** and helps you in managing them."
page_type: "built-in"
structured_data_how_to_title: "Configure Multi Console"
structured_data_how_to_tip1: "Install the extension for Chrome-based Browser or Firefox."
structured_data_how_to_tip2: "Enable the Multi Console in the option panel of Leapp."
structured_data_how_to_tip3: "Right-click on a session you want to open in the AWS Web Console."
structured_data_how_to_tip4: "Click on Open Web Console."
social_title: "Configure Named Profiles"
social_description: "How to configure Multi Console. The Leapp Multi-Console Browser Extension allows you to open **multiple instances of the AWS Web Console in the same browser window** and helps you in managing them."
social_relative_image_path: "configure-multi-console.png"
---

## What is Multi Console

The Leapp Multi-Console Browser Extension allows you to open **multiple instances of 
the AWS Web Console in the same browser window** and helps you in managing them.

<div class="button-container">
  <a href="https://addons.mozilla.org/en-US/firefox/addon/leapp-multi-console-extension/" class="md-button md-button--primary installation-button">Get it on Firefox ⇩<i></i></a>
  <a href="https://d3o59asa8udcq9.cloudfront.net/extension/leapp-extension-chromium-latest.zip" class="md-button md-button--primary installation-button">Get it on Chrome ⇩</a>
</div>

### List of Supported Browsers

| Browser                    | Supported
| -------------------------- | ------------------------------------ 
| Firefox                    | :white_check_mark:
| Chrome                     | :white_check_mark:
| Edge                       | :white_check_mark:
| Brave                      | :white_check_mark:
| Safari                     | :x:

## How to Configure Multi Console in Leapp

### Install the Extension

#### Firefox

You can get the extension on the official Mozilla Addons Store and install it from there:

1. Visit the page by clicking the button below
2. Then Click on Add to Firefox

[Get it on Firefox ⇩](https://addons.mozilla.org/en-US/firefox/addon/leapp-multi-console-extension/){ .md-button .md-button--primary }

#### Chrome, Edge and other Chromium based browsers

!!! info
    
    Because the extension at the moment relies on Manifest V2, we are unable to upload the extension on the official stores. 
    For more info see [Chrome extension documentation](https://developer.chrome.com/docs/extensions/mv3/mv2-sunset/)

The extension can only be installed manually. To do so, follow these instructions:

1. Download the zip archive by clicking on the button below
2. Unzip the file
3. Open your browser and navigate to `about://extensions`
4. Enable **Developer mode** in the top right corner
5. Then click on **Load unpacked** in the top left corner
6. Finally, Select the folder extracted previously

[Get it on Chrome/Others ⇩](https://d3o59asa8udcq9.cloudfront.net/extension/leapp-extension-chromium-latest.zip){ .md-button .md-button--primary }

### Uninstall the Extension

#### Firefox

1. Visit `about:addons`
2. Select Leapp Browser Extension and click on the 3 dots
3. Click on Remove

#### Chrome, Edge and other Chromium based browsers

1. Visit `about://extensions`
2. Search for Leapp Browser Extension and click on Remove
3. See warning section below

!!! warning

    If you are using the Chrome version and you uninstalled or disabled the extension, you have to manually clear cookies for the AWS Console. To do so,
    when accessing the login page of the AWS Console, on the left of the address bar, click the lock icon and select "Cookies". 
    Then, remove all cookies by clicking "Remove" until the cookie list is empty and finally click on Done 
    <div class="button-container" style="background-color:none!important">
      <img alt="uninstall extension step 1" src="../../images/built-in-features/extension-uninstall-1.png?style=even-smaller-img;background-color:none!important" class="installation-button">
      <img alt="uninstall extension step 2" src="../../images/built-in-features/extension-uninstall-2.png?style=even-smaller-img;background-color:none!important" class="installation-button">
    </div>


### How to use it

Once you installed the extension on your browser, you need to enable the Multi-Console Extension on the Leapp Desktop App in order to use it.

Click on the top-right cog icon to access the settings, click on the **Multi-Console** tab and then click **Enable Multi-Console Extension**.

![enable option](../../images/built-in-features/enable-option.png?style=even-smaller-img)

From the contextual menu of a session (accessed by right-clicking on it), simply select **Open Web Console**. 

!!! info 
    
    If any communication error occurs, your browser is not open or you don't have the extension installed/enabled on it, the web console will be opened in your default
    browser without using the extension (and will be limited to a single session).

---

By clicking on the Leapp Multi-Console Extension icon in your browser, a list of all currently active sessions will be shown. 

This list contains information obtained from Leapp about the session, including **Session Name, Session Role and Session Region**.

![leapp browser ui](../../images/built-in-features/leapp-browser-ui.png?style=even-smaller-img)

In the extension interface, click on a row to select and **focus the tab in which you opened the related AWS Console**, so you can easily navigate among many AWS Consoles
at the same time.

