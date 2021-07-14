# Default Options

Changing a Default Region or Location means that **every new access method**, both AWS or AZURE, **will present the selected Region (AWS) or Location (AZURE) as the one defined by default in the select option of the form**.

Also, a default Region/Location **will be used to patch old sessions prior to release 0.4.3, to have it as the default one**.

Every **Service Provider call** done with the **active session** will be **directed (if possible) in the selected region**.

### Where to change default Region/Location

Both for **active** and **inactive** sessions you can access the change region modal by clicking on a session's menu button:

![](../images/contributing/default_options/DEFAULT_OPTIONS-1.png)

And by selecting "Change Region/Location" (depending on the type of Session). Here you'll get into a modal to change the current region for a session.

![](../images/contributing/default_options/DEFAULT_OPTIONS-2.png)

> *Note: if the session is active, the actual credentials will be [rotated](../concepts.md) by new ones that reflect the newly selected region*.
