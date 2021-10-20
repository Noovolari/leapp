/*
* Everytime you need to add a new native service from a node.js module the procedure is:
* - do the normal npm install from the IntelliJ terminal from the root of your project
* - add the require in the main index.html file pointing to a window object of your choice e.g. window.mylib; use the already added libraries as reference
* - create an entry in this file; now through native service you can inject that library everywhere in the angular code!
*/
import * as Keytar from 'keytar';
