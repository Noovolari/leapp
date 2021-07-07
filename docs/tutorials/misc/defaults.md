Changing a Default Region or Location means that **every new Strategy**, both AWS or AZURE, **will present the selected Region (AWS) or Location (AZURE) as the one defined by default in the select option of the form**.

Also, a default Region/Location **will be used to patch old sessions prior to release 0.4.3, to have it as the default one**.

Every **Service Provider call** done with the **active session** will be **directed (if possible) in the selected region**.

The user has also the ability to **switch any session's Region/Location anytime** after session's creation. To do so check this other [guide](https://github.com/Noovolari/leapp/wiki/Change-Session-Region-Location).

### Where to change default Region/Location

Just go to the option page, you'll find the new selectors there, as show in figure:

<img width="406" alt="Screenshot 2021-02-08 at 15 42 57" src="https://user-images.githubusercontent.com/9497292/107234938-789f3a00-6a24-11eb-9363-e2e58f772f6b.png">

