# Update Leapp

## Desktop App

Leapp checks if a new version is available every **10 minutes** (starting from the application launch). 
If so, a dialog message will pop up and show a `version number`, the `release date` and the `changelog`


![](../../images/screens/newuxui/update.png)
In this modal, a user can do the following:

=== "Remind me later"
    
    Leapp will close the modal and notify the user that a new update
    is available by adding a notification dot
    <img width="55" alt="Screenshot_2021-05-04_at_10 28 21 (1)" src="https://user-images.githubusercontent.com/9497292/152328456-9fa51c95-d675-4b71-bd95-85c56b290843.png"> 
    to the Dock Bar icon. Users will not be bothered anymore until the next release is available. 
    This option is **convenient for users that want to stick to a specific version**. 
    Note that you can do this for every version and maintain the one you prefer.


=== "Download update"

    Leapp will open the Release URL in your *default* browser to let the User 
    *manually* download the release for their specific OS and install it.


=== "Click on X"
    
    Leapp will close the modal and another one will appear in **10 minutes**.

### macOS (Homebrew), Linux (Linuxbrew) and Windows (via WSL)

Leapp can also be updated via [Homebrew Cask](https://brew.sh/) with:
`brew upgrade leapp`

## CLI

Depeding on which method you used to install the CLI ([npm](https://www.npmjs.com/package/@noovolari/leapp-cli) or Homebrew on macOS) you can update it with the following commands:

=== "npm"

    ```console
    $ npm update -g @noovolari/leapp-cli
    ```

=== "Homebrew (macOS)"

    ```console
    $ brew upgrade Noovolari/brew/leapp-cli
    ```
