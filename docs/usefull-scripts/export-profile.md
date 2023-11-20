# AWS Profile Selector: Simplifying AWS Profile Selection with the Leapp CLI

This script enhances the AWS profile selection process by utilizing the Leapp CLI. It provides a streamlined way to switch between AWS profiles in the command line environment, allowing for easy management of multiple AWS configurations.

```bash
function select_and_export_aws_profile() {
    local selected_profile
    selected_profile=$(leapp session list | \
        grep -w 'active' | \
        awk '{print $(NF-2)}' | \
        fzf --height 30% -1 -0 --header 'Select AWS profile')
    if [[ -n "$selected_profile" ]]; then
        export AWS_PROFILE="$selected_profile"
        echo "AWS_PROFILE=$AWS_PROFILE"
    fi
}

alias awsp=select_and_export_aws_profile
```

To use the script, it's important to note that you need to have Leapp installed and running. Leapp is a command-line tool for managing AWS profiles and sessions. Before executing the script, ensure that Leapp is installed on your system and at least one AWS session is active.

Leapp keeps track of your AWS sessions and allows you to switch between different profiles seamlessly. It's a valuable tool for managing multiple AWS accounts and simplifying your workflow. Once Leapp is installed and running, the script utilizes its functionality to retrieve the list of active sessions and display them for selection.

By integrating '`fzf`' with Leapp, the script provides an interactive and convenient way to choose the desired AWS profile. With a few keystrokes, you can quickly switch between AWS profiles without manually setting the environment variables each time.

Remember to save the script in your shell configuration file (`.bashrc` or `.zshrc`) and restart your terminal or reload the configuration file for the changes to take effect.

In summary, this script simplifies the process of selecting and exporting an AWS profile, making it easier to switch between different AWS configurations when using the command line.