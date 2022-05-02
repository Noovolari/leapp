## Default Leapp directories

Here the user can find all the directories that Leapp uses **directly** or **indirectly**.

### Installation path
By default, Leapp is installed in the following locations:

=== "MacOS"

    ```
    /Applications
    ```

=== "Linux"

    ```
    /opt/Leapp
    ```

=== "Windows"

    ```
    C:\Users\<USER>\AppData\Local\Programs\Leapp
    ```

### Configuration files
By default, Leapp stores the configuration files in the following locations:

=== "MacOS"

    ```
    ~/.Leapp
    ```

=== "Linux"

    ```
    ~/.Leapp
    ```

=== "Windows"

    ```
    C:\Users\<USER>\.Leapp
    ```

!!! Info

    - **Leapp-lock.json** is used to store your actual configuration and is **encrypted**.
    - **.latest** contains the latest version of your Leapp application. In case the file is removed accidentally or intentionally it will be created again when the app is restarted.

### Credentials file
By default, Leapp writes the credentials file in the following locations:

=== "MacOS"

    ```
    ~/.aws
    ```

=== "Linux"

    ```
    ~/.aws
    ```

=== "Windows"

    ```
    C:\Users\<USER>\.aws
    ```
### Logs file
By default, Leapp writes logs to the following locations:

=== "MacOS"

    ```
    ~/Library/Logs/Leapp/log.electronService.log
    ```

=== "Linux"

    ```
    ~/.config/Leapp/logs/log.electronService.log
    ```

=== "Windows"

    ```
    C:\Users\<USER>\AppData\Roaming\Leapp\log.electronService.log
    ```
!!! Info

    Logs are structured in the following way:

    ```
    [YYYY-MM-DD HH:mm:ss.mmm] [LEVEL] [rendered/system] [COMPONENT] MESSAGE {Useful Object / Stacktrace Err Object}
    ```

!!! Warning

    Please always add logs to any issue you want to fill whenever possible, so you can help the team identify 
    the problem quickly
