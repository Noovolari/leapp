'use strict';
const electron = require('electron');
const {download} = require('electron-dl');
const isDev = require('electron-is-dev');
const sliceAnsi = require('slice-ansi');
const stripAnsi = require('strip-ansi');
const isFullwidthCodePoint = require('is-fullwidth-code-point');
const emojiRegex = require('emoji-regex');
const stringWidth = string => {
  if (typeof string !== 'string' || string.length === 0) {
    return 0;
  }

  string = stripAnsi(string);

  if (string.length === 0) {
    return 0;
  }

  string = string.replace(emojiRegex(), '  ');

  let width = 0;

  for (let i = 0; i < string.length; i++) {
    const code = string.codePointAt(i);

    // Ignore control characters
    if (code <= 0x1F || (code >= 0x7F && code <= 0x9F)) {
      continue;
    }

    // Ignore combining characters
    if (code >= 0x300 && code <= 0x36F) {
      continue;
    }

    // Surrogates
    if (code > 0xFFFF) {
      i++;
    }

    width += isFullwidthCodePoint(code) ? 2 : 1;
  }

  return width;
};

const webContents = win => win.webContents || (win.id && win);

const decorateMenuItem = menuItem => {
  return (options: any = {}) => {
    if (options.transform && !options.click) {
      menuItem.transform = options.transform;
    }

    return menuItem;
  };
};

const removeUnusedMenuItems = menuTemplate => {
  let notDeletedPreviousElement;

  return menuTemplate
    .filter(menuItem => menuItem !== undefined && menuItem !== false && menuItem.visible !== false && menuItem.visible !== '')
    .filter((menuItem, index, array) => {
      const toDelete = menuItem.type === 'separator' && (!notDeletedPreviousElement || index === array.length - 1 || array[index + 1].type === 'separator');
      notDeletedPreviousElement = toDelete ? notDeletedPreviousElement : menuItem;
      return !toDelete;
    });
};


const cliTruncate = (text, columns, options) => {
  options = {
    position: 'end',
    preferTruncationOnSpace: false,
    ...options
  };

  function getIndexOfNearestSpace(string, index, shouldSearchRight) {
    if (string.charAt(index) === ' ') {
      return index;
    }

    for (let i = 1; i <= 3; i++) {
      if (shouldSearchRight) {
        if (string.charAt(index + i) === ' ') {
          return index + i;
        }
      } else if (string.charAt(index - i) === ' ') {
        return index - i;
      }
    }

    return index;
  }

  const {position, space, preferTruncationOnSpace} = options;
  let ellipsis = '…';
  let ellipsisWidth = 1;

  if (typeof text !== 'string') {
    throw new TypeError(`Expected \`input\` to be a string, got ${typeof text}`);
  }

  if (typeof columns !== 'number') {
    throw new TypeError(`Expected \`columns\` to be a number, got ${typeof columns}`);
  }

  if (columns < 1) {
    return '';
  }

  if (columns === 1) {
    return ellipsis;
  }

  const length = stringWidth(text);

  if (length <= columns) {
    return text;
  }

  if (position === 'start') {
    if (preferTruncationOnSpace) {
      const nearestSpace = getIndexOfNearestSpace(text, length - columns + 1, true);
      return ellipsis + sliceAnsi(text, nearestSpace, length).trim();
    }

    if (space === true) {
      ellipsis += ' ';
      ellipsisWidth = 2;
    }

    return ellipsis + sliceAnsi(text, length - columns + ellipsisWidth, length);
  }

  if (position === 'middle') {
    if (space === true) {
      ellipsis = ' ' + ellipsis + ' ';
      ellipsisWidth = 3;
    }

    const half = Math.floor(columns / 2);

    if (preferTruncationOnSpace) {
      const spaceNearFirstBreakPoint = getIndexOfNearestSpace(text, half, false);
      const spaceNearSecondBreakPoint = getIndexOfNearestSpace(text, length - (columns - half) + 1, true);
      return sliceAnsi(text, 0, spaceNearFirstBreakPoint) + ellipsis + sliceAnsi(text, spaceNearSecondBreakPoint, length).trim();
    }

    return (
      sliceAnsi(text, 0, half) +
      ellipsis +
      sliceAnsi(text, length - (columns - half) + ellipsisWidth, length)
    );
  }

  if (position === 'end') {
    if (preferTruncationOnSpace) {
      const nearestSpace = getIndexOfNearestSpace(text, columns - 1, false);
      return sliceAnsi(text, 0, nearestSpace) + ellipsis;
    }

    if (space === true) {
      ellipsis = ' ' + ellipsis;
      ellipsisWidth = 2;
    }

    return sliceAnsi(text, 0, columns - ellipsisWidth) + ellipsis;
  }

  throw new Error(`Expected \`options.position\` to be either \`start\`, \`middle\` or \`end\`, got ${position}`);
};

const create = (win, options) => {
  const handleContextMenu = (event, props) => {
    if (typeof options.shouldShowMenu === 'function' && options.shouldShowMenu(event, props) === false) {
      return;
    }

    const {editFlags} = props;
    const hasText = props.selectionText.length > 0;
    const isLink = Boolean(props.linkURL);
    const can = type => editFlags[`can${type}`] && hasText;

    const defaultActions = {
      separator: () => ({type: 'separator'}),
      learnSpelling: decorateMenuItem({
        id: 'learnSpelling',
        label: '&Learn Spelling',
        visible: Boolean(props.isEditable && hasText && props.misspelledWord),
        click() {
          const target = webContents(win);
          target.session.addWordToSpellCheckerDictionary(props.misspelledWord);
        }
      }),
      lookUpSelection: decorateMenuItem({
        id: 'lookUpSelection',
        label: 'Look Up “{selection}”',
        visible: process.platform === 'darwin' && hasText && !isLink,
        click() {
          if (process.platform === 'darwin') {
            webContents(win).showDefinitionForSelection();
          }
        }
      }),
      searchWithGoogle: decorateMenuItem({
        id: 'searchWithGoogle',
        label: '&Search with Google',
        visible: hasText,
        click() {
          const url = new URL('https://www.google.com/search');
          url.searchParams.set('q', props.selectionText);
          electron.shell.openExternal(url.toString());
        }
      }),
      cut: decorateMenuItem({
        id: 'cut',
        label: 'Cu&t',
        enabled: can('Cut'),
        visible: props.isEditable,
        click(menuItem) {
          const target = webContents(win);

          if (!menuItem.transform && target) {
            target.cut();
          } else {
            props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
            electron.clipboard.writeText(props.selectionText);
          }
        }
      }),
      copy: decorateMenuItem({
        id: 'copy',
        label: '&Copy',
        enabled: can('Copy'),
        visible: props.isEditable || hasText,
        click(menuItem) {
          const target = webContents(win);

          if (!menuItem.transform && target) {
            target.copy();
          } else {
            props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
            electron.clipboard.writeText(props.selectionText);
          }
        }
      }),
      paste: decorateMenuItem({
        id: 'paste',
        label: '&Paste',
        enabled: editFlags.canPaste,
        visible: props.isEditable,
        click(menuItem) {
          const target = webContents(win);

          if (menuItem.transform) {
            let clipboardContent = electron.clipboard.readText(props.selectionText);
            clipboardContent = menuItem.transform ? menuItem.transform(clipboardContent) : clipboardContent;
            target.insertText(clipboardContent);
          } else {
            target.paste();
          }
        }
      }),
      selectAll: decorateMenuItem({
        id: 'selectAll',
        label: 'Select &All',
        click() {
          webContents(win).selectAll();
        }
      }),
      saveImage: decorateMenuItem({
        id: 'saveImage',
        label: 'Save I&mage',
        visible: props.mediaType === 'image',
        click(menuItem) {
          props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;
          download(win, props.srcURL);
        }
      }),
      saveImageAs: decorateMenuItem({
        id: 'saveImageAs',
        label: 'Sa&ve Image As…',
        visible: props.mediaType === 'image',
        click(menuItem) {
          props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;
          download(win, props.srcURL, {saveAs: true});
        }
      }),
      saveVideo: decorateMenuItem({
        id: 'saveVideo',
        label: 'Save Vide&o',
        visible: props.mediaType === 'video',
        click(menuItem) {
          props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;
          download(win, props.srcURL);
        }
      }),
      saveVideoAs: decorateMenuItem({
        id: 'saveVideoAs',
        label: 'Save Video& As…',
        visible: props.mediaType === 'video',
        click(menuItem) {
          props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;
          download(win, props.srcURL, {saveAs: true});
        }
      }),
      copyLink: decorateMenuItem({
        id: 'copyLink',
        label: 'Copy Lin&k',
        visible: props.linkURL.length > 0 && props.mediaType === 'none',
        click(menuItem) {
          props.linkURL = menuItem.transform ? menuItem.transform(props.linkURL) : props.linkURL;

          electron.clipboard.write({
            bookmark: props.linkText,
            text: props.linkURL
          });
        }
      }),
      saveLinkAs: decorateMenuItem({
        id: 'saveLinkAs',
        label: 'Save Link As…',
        visible: props.linkURL.length > 0 && props.mediaType === 'none',
        click(menuItem) {
          props.linkURL = menuItem.transform ? menuItem.transform(props.linkURL) : props.linkURL;
          download(win, props.linkURL, {saveAs: true});
        }
      }),
      copyImage: decorateMenuItem({
        id: 'copyImage',
        label: 'Cop&y Image',
        visible: props.mediaType === 'image',
        click() {
          webContents(win).copyImageAt(props.x, props.y);
        }
      }),
      copyImageAddress: decorateMenuItem({
        id: 'copyImageAddress',
        label: 'C&opy Image Address',
        visible: props.mediaType === 'image',
        click(menuItem) {
          props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;

          electron.clipboard.write({
            bookmark: props.srcURL,
            text: props.srcURL
          });
        }
      }),
      copyVideoAddress: decorateMenuItem({
        id: 'copyVideoAddress',
        label: 'Copy Video Ad&dress',
        visible: props.mediaType === 'video',
        click(menuItem) {
          props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;

          electron.clipboard.write({
            bookmark: props.srcURL,
            text: props.srcURL
          });
        }
      }),
      inspect: () => ({
        id: 'inspect',
        label: 'I&nspect Element',
        click() {
          webContents(win).inspectElement(props.x, props.y);

          if (webContents(win).isDevToolsOpened()) {
            webContents(win).devToolsWebContents.focus();
          }
        }
      }),
      services: () => ({
        id: 'services',
        label: 'Services',
        role: 'services',
        visible: process.platform === 'darwin' && (props.isEditable || hasText)
      })
    };

    const shouldShowInspectElement = typeof options.showInspectElement === 'boolean' ? options.showInspectElement : isDev;
    const shouldShowSelectAll = options.showSelectAll || (options.showSelectAll !== false && process.platform !== 'darwin');

    function word(suggestion) {
      return {
        id: 'dictionarySuggestions',
        label: suggestion,
        visible: Boolean(props.isEditable && hasText && props.misspelledWord),
        click(menuItem) {
          const target = webContents(win);
          target.replaceMisspelling(menuItem.label);
        }
      };
    }

    let dictionarySuggestions = [];
    if (hasText && props.misspelledWord && props.dictionarySuggestions.length > 0) {
      dictionarySuggestions = props.dictionarySuggestions.map(suggestion => word(suggestion));
    } else {
      dictionarySuggestions.push(
        {
          id: 'dictionarySuggestions',
          label: 'No Guesses Found',
          visible: Boolean(hasText && props.misspelledWord),
          enabled: false
        }
      );
    }

    let menuTemplate = [
      dictionarySuggestions.length > 0 && defaultActions.separator(),
      ...dictionarySuggestions,
      defaultActions.separator(),
      options.showLearnSpelling !== false && defaultActions.learnSpelling(),
      defaultActions.separator(),
      options.showLookUpSelection !== false && defaultActions.lookUpSelection(),
      defaultActions.separator(),
      options.showSearchWithGoogle !== false && defaultActions.searchWithGoogle(),
      defaultActions.separator(),
      defaultActions.cut(),
      defaultActions.copy(),
      defaultActions.paste(),
      shouldShowSelectAll && defaultActions.selectAll(),
      defaultActions.separator(),
      options.showSaveImage && defaultActions.saveImage(),
      options.showSaveImageAs && defaultActions.saveImageAs(),
      options.showCopyImage !== false && defaultActions.copyImage(),
      options.showCopyImageAddress && defaultActions.copyImageAddress(),
      options.showSaveVideo && defaultActions.saveVideo(),
      options.showSaveVideoAs && defaultActions.saveVideoAs(),
      options.showCopyVideoAddress && defaultActions.copyVideoAddress(),
      defaultActions.separator(),
      options.showCopyLink !== false && defaultActions.copyLink(),
      options.showSaveLinkAs && defaultActions.saveLinkAs(),
      defaultActions.separator(),
      shouldShowInspectElement && defaultActions.inspect(),
      options.showServices && defaultActions.services(),
      defaultActions.separator()
    ];

    if (options.menu) {
      menuTemplate = options.menu(defaultActions, props, win, dictionarySuggestions, event);
    }

    if (options.prepend) {
      const result = options.prepend(defaultActions, props, win, event);

      if (Array.isArray(result)) {
        menuTemplate.unshift(...result);
      }
    }

    if (options.append) {
      const result = options.append(defaultActions, props, win, event);

      if (Array.isArray(result)) {
        menuTemplate.push(...result);
      }
    }

    // Filter out leading/trailing separators
    // TODO: https://github.com/electron/electron/issues/5869
    menuTemplate = removeUnusedMenuItems(menuTemplate);

    for (const menuItem of menuTemplate) {
      // Apply custom labels for default menu items
      if (options.labels && options.labels[menuItem.id]) {
        menuItem.label = options.labels[menuItem.id];
      }

      // Replace placeholders in menu item labels
      if (typeof menuItem.label === 'string' && menuItem.label.includes('{selection}')) {
        const selectionString = typeof props.selectionText === 'string' ? props.selectionText.trim() : '';
        menuItem.label = menuItem.label.replace('{selection}', cliTruncate(selectionString, 25, {}).replace(/&/g, '&&'));
      }
    }

    if (menuTemplate.length > 0) {
      const menu = electron.Menu.buildFromTemplate(menuTemplate);

      if (typeof options.onShow === 'function') {
        menu.on('menu-will-show', options.onShow);
      }

      if (typeof options.onClose === 'function') {
        menu.on('menu-will-close', options.onClose);
      }

      menu.popup(win);
    }
  };

  webContents(win).on('context-menu', handleContextMenu);

  return () => {
    if (win.isDestroyed()) {
      return;
    }

    webContents(win).removeListener('context-menu', handleContextMenu);
  };
};

export function contextMenu(options: any = {}) {
  if ((process as any).type === 'renderer') {
    throw new Error('Cannot use electron-context-menu in the renderer process!');
  }

  let isDisposed = false;
  const disposables = [];

  const init = win => {
    if (isDisposed) {
      return;
    }

    const disposeMenu = create(win, options);

    disposables.push(disposeMenu);
    const removeDisposable = () => {
      const index = disposables.indexOf(disposeMenu);
      if (index !== -1) {
        disposables.splice(index, 1);
      }
    };

    if (typeof win.once !== 'undefined') { // Support for BrowserView
      win.once('closed', removeDisposable);
    }

    disposables.push(() => {
      win.off('closed', removeDisposable);
    });
  };

  const dispose = () => {
    for (const dispose of disposables) {
      dispose();
    }

    disposables.length = 0;
    isDisposed = true;
  };

  if (options.window) {
    const win = options.window;

    // When window is a webview that has not yet finished loading webContents is not available
    if (webContents(win) === undefined) {
      const onDomReady = () => {
        init(win);
      };

      const listenerFunction = win.addEventListener || win.addListener;
      listenerFunction('dom-ready', onDomReady, {once: true});

      disposables.push(() => {
        win.removeEventListener('dom-ready', onDomReady, {once: true});
      });

      return dispose;
    }

    init(win);

    return dispose;
  }

  for (const win of electron.BrowserWindow.getAllWindows()) {
    init(win);
  }

  const onWindowCreated = (event, win) => {
    init(win);
  };

  electron.app.on('browser-window-created', onWindowCreated);
  disposables.push(() => {
    electron.app.removeListener('browser-window-created', onWindowCreated);
  });

  return dispose;
};
