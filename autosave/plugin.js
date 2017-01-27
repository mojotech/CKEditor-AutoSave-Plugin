/**
 * @license Copyright (c) CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

(function() {
  if (!supportsLocalStorage()) {
    CKEDITOR.plugins.add("autosave", {}); //register a dummy plugin to pass CKEditor plugin initialization process
    return;
  }

  CKEDITOR.plugins.add("autosave", {
    lang: 'ca,cs,de,en,es,fr,ja,nl,pl,pt-br,ru,sk,sv,zh,zh-cn', // %REMOVE_LINE_CORE%
    version: "0.17.1",
    init: function (editor) {
      // Default Config
      var defaultConfig = {
        delay: 10,
        saveDetectionSelectors: "a[href^='javascript:__doPostBack'][id*='Save'],a[id*='Cancel']",
        saveOnDestroy: false,
        NotOlderThen: 1440,
        SaveKey: 'autosave_' + window.location + "_" + editor.id,
      };

      // Get Config & Lang
      var config = CKEDITOR.tools.extend(defaultConfig, editor.config.autosave || {}, true);

      editor.on('instanceReady', function(){
        if (typeof (jQuery) === 'undefined') {
          CKEDITOR.scriptLoader.load('//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js', function() {
            jQuery.noConflict();

            loadPlugin(editor, config);
          });

        } else {
          CKEDITOR.scriptLoader.load(CKEDITOR.getUrl(CKEDITOR.plugins.getPath('autosave') + 'js/extensions.min.js'), function() {
            loadPlugin(editor, config);
          });
        }
      }, editor, null, 100);
    }
  });

  function loadPlugin(editorInstance, config) {
    var autoSaveKey = config.SaveKey != null ? config.SaveKey : 'autosave_' + window.location + "_" + editorInstance.id;
    var notOlderThen = config.NotOlderThen != null ? config.NotOlderThen : 1440;
    var saveOnDestroy = config.saveOnDestroy != null ? config.saveOnDestroy : false;
    var saveDetectionSelectors =
    config.saveDetectionSelectors != null ? config.saveDetectionSelectors : "a[href^='javascript:__doPostBack'][id*='Save'],a[id*='Cancel']";

    var cdnScripts = [];

    if(typeof LZString === 'undefined') {
      cdnScripts.push('https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js');
    }

    if(typeof moment === 'undefined') {
      cdnScripts.push('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js');
    }

    CKEDITOR.scriptLoader.load(cdnScripts, function() {
      CheckForAutoSavedContent(editorInstance, autoSaveKey, notOlderThen);
    });

    jQuery(saveDetectionSelectors).click(function() {
      RemoveStorage(autoSaveKey, editorInstance);
    });

    editorInstance.on('change', function() {
      startTimer(config, editorInstance);
    });

    editorInstance.on('destroy', function() {
      if (saveOnDestroy) {
        SaveData(autoSaveKey, editorInstance, config);
      }
    });
  }

  function autoSaveMessageId(editorInstance) {
    return 'cke_autoSaveMessage_' + editorInstance.name;
  }

  var startTimer = function (configAutosave, editorInstance) {
    if (editorInstance.config.autosave_timeOutId == null) {
      var delay = configAutosave.delay != null ? configAutosave.delay : 10;
      editorInstance.config.autosave_timeOutId = setTimeout(function() {
        onTimer(configAutosave, editorInstance);
      },
        delay * 1000);
    }
  };
  function onTimer (configAutosave, editorInstance) {
    if (editorInstance.checkDirty() || editorInstance.plugins.bbcode) {
      var editor = editorInstance,
        autoSaveKey = configAutosave.SaveKey != null
                    ? configAutosave.SaveKey
                    : 'autosave_' + window.location + "_" + editor.id;

      SaveData(autoSaveKey, editor, configAutosave);

      clearTimeout(editorInstance.config.autosave_timeOutId);

      editorInstance.config.autosave_timeOutId = null;
    }
  };

  // localStorage detection
  function supportsLocalStorage() {
    if (typeof (Storage) === 'undefined') {
      return false;
    }

    try {
      localStorage.getItem("___test_key");
      return true;
    } catch (e) {
      return false;
    }
  }

  function CheckForAutoSavedContent(editorInstance, autoSaveKey, notOlderThen) {
    // Checks If there is data available and load it
    if (localStorage.getItem(autoSaveKey)) {
      var jsonSavedContent = LoadData(autoSaveKey);

      var autoSavedContent = jsonSavedContent.data;
      var autoSavedContentDate = jsonSavedContent.saveTime;

      var editorLoadedContent = editorInstance.getData();

      // check if the loaded editor content is the same as the autosaved content
      if (editorLoadedContent == autoSavedContent) {
        localStorage.removeItem(autoSaveKey);
        return;
      }

      // Ignore if autosaved content is older then x minutes
      if (moment(new Date()).diff(new Date(autoSavedContentDate), 'minutes') > notOlderThen) {
        RemoveStorage(autoSaveKey, editorInstance);

        return;
      }

      editorInstance.loadSnapshot(LoadData(autoSaveKey).data);
      RemoveStorage(autoSaveKey, editorInstance);
    }
  }

  function LoadData(autoSaveKey) {
    var compressedJSON = LZString.decompressFromUTF16(localStorage.getItem(autoSaveKey));
    return JSON.parse(compressedJSON);
  }

  function SaveData(autoSaveKey, editorInstance, config) {
    var compressedJSON = LZString.compressToUTF16(JSON.stringify({ data: editorInstance.getData(), saveTime: new Date() }));
    var quotaExceeded = false;

    try {
      localStorage.setItem(autoSaveKey, compressedJSON);
    } catch (e) {
      quotaExceeded = isQuotaExceeded(e);
      if (quotaExceeded) {
        console.warn(editorInstance.lang.autosave.localStorageFull);
      }
    }
  }

  function RemoveStorage(autoSaveKey, editor) {
    if (editor.config.autosave_timeOutId) {
      clearTimeout(editor.config.autosave_timeOutId);
    }

    localStorage.removeItem(autoSaveKey);
  }

  function isQuotaExceeded(e) {
    var quotaExceeded = false;
    if (e) {
      if (e.code) {
        switch (e.code) {
          case 22:
            quotaExceeded = true;
            break;
          case 1014:
            // Firefox
            if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
              quotaExceeded = true;
            }
            break;
        }
      } else if (e.number === -2147024882) {
        // Internet Explorer 8
        quotaExceeded = true;
      }
    }
    return quotaExceeded;
  }
})();
