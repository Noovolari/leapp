# Update Leapp

## Desktop App

Leapp checks if a new version is available every **10 minutes** (starting from the application launch). 
If so, a dialog message will pop up and show a `version number`, the `release date` and the `changelog`


![](../../images/screens/newuxui/update.png?style=smaller-img)
In this modal, a user can do the following:

=== "Remind me later"
    
    Leapp closes the dialog and won't offer this version again. Nothing else reminds you
    of it: no notification dot stays on the bell or on the Dock icon. When a newer version
    is released, Leapp offers that one.
    This option is **convenient for users that want to stick to a specific version**. 
    Note that you can do this for every version and maintain the one you prefer.


=== "Download update"

    Leapp opens the releases page in your *default* browser to let you
    *manually* download the release for your OS and install it. Leapp offers
    the same version again until you install it or click "Remind me later".


=== "Click on X"
    
    Same as "Remind me later": Leapp closes the dialog and won't offer this version again.

While a new version is waiting for an answer, the bell in the top bar shows a notification dot,
the tray menu has a "Check for Updates..." entry that reopens the dialog and, on macOS, the
Dock icon shows a small dot. "What's new" in the bell menu shows the changelog at any time.

### macOS (Homebrew), Linux (Linuxbrew) and Windows (via WSL)

Leapp can also be updated via [Homebrew Cask](https://brew.sh/){: target='_blank'} with:
`brew upgrade leapp`

## CLI

Depending on which method you used to install the CLI ([npm](https://www.npmjs.com/package/@noovolari/leapp-cli){: target='_blank'} or Homebrew on macOS), you can update it with the following commands:

=== "npm"

    ```console
    npm update -g @noovolari/leapp-cli
    ```

=== "Homebrew (macOS)"

    ```console
    brew upgrade Noovolari/brew/leapp-cli
    ```
