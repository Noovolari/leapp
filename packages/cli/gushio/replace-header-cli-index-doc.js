const fs = require("fs");
module.exports = {
  cli: {
    name: 'prepare docs',
      description: 'Prepare docs for MKDOCS for the leapp CLI',
      version: '0.1',
  },
  run: async () => {
    const fs = require("fs");
    let text = fs.readFileSync("README.md");
    console.log("...reading file README.md");
    const position = text.indexOf("# Usage");
    text = text.slice(position + 7);
    console.log("...modifying file README.md");
    const header = "Leapp's Command Line Interface.\n" +
      "\n" +
      "!!! warning\n" +
      "\n" +
      "    Leapp CLI works only if the Desktop App is installed and running.\n" +
      "    Note that version >= v0.11.0 of the Desktop App is required.\n" +
      "    Check the [installation guide](../installation/install-leapp/){: target='_blank'} to install the Desktop App.\n" +
      "\n" +
      "\n"
    text = header + text.toString().replace("# Commands", "").replace("# Command Topics", "## Command Topics");

    fs.writeFileSync("index.md", text);
    console.log("...README.md to index.md: corrected and saved");

    const filenames = fs.readdirSync("scopes");
    console.log("...scopes/");
    filenames.forEach((filename) => {
      console.log("   |...corrected " + filename);
      let fileData = fs.readFileSync("scopes/" + filename, 'utf-8');
      fileData = fileData.replace(/```\nUSAGE/g, "```console\nUSAGE").replace(/##/g, "#");
      fs.writeFileSync("scopes/" + filename, fileData);
    });
    console.log("...conversion completed");

    fs.copyFileSync("index.md", "../../docs/cli/index.md");
    console.log('...Successfully moved index.md in docs/cli');

    if (!fs.existsSync("../../docs/cli/scopes")) {
      fs.mkdirSync("../../docs/cli/scopes");
    }

    filenames.forEach((filename) => {
      fs.copyFileSync("scopes/" + filename, "../../docs/cli/scopes/" + filename);
      console.log("...Successfully moved " + filename + " in docs/cli/scopes");
    });
  }
}
