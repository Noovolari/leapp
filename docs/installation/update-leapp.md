# Update Leapp

Leapp checks every **10 minutes** (counting from application start) that a new version is available. 
If so, a dialog message will pop up and show `version number`, `release date` and `changelog`

<img width="426" alt="Screenshot 2021-05-11 at 10 45 58" src="https://user-images.githubusercontent.com/9497292/117786735-1e418f80-b246-11eb-8e53-b3a5f4c79126.png">

In this modal, a user has the ability to:

=== "Remind me later"
    
    Leapp will shut down the modal, notify the user that a new update
    is available by changing the Tray icon (adding a red dot) 
    <img width="55" alt="Screenshot_2021-05-04_at_10 28 21 (1)" src="https://user-images.githubusercontent.com/9497292/117785141-97d87e00-b244-11eb-83e7-c39b8f771314.png">. 
    Now users will not be bothered anymore until the next release is available. 
    This option is **suitable for users that want to stick to a specific version**. 
    Note that you can do this for every version and maintain the one you prefer.


=== "Download update"

    Leapp will open the Release URL in your *default* browser to let the User 
    *manually* download the release for the specific OS and install it.


=== "Click on X"
    
    Leapp will close the modal and another one will appear in **10 minutes**.

## macOS (Homebrew), Linux (Linuxbrew) and Windows (via WSL)

Leapp can also be updated via [Homebrew Cask](https://brew.sh/) with:
`brew upgrade leapp`
