CKEditor-AutoSave-Plugin
========================

Auto Save Plugin for the CKEditor which automatically saves the content (via HTML5 LocalStorage) temporarly (for example when a login session times out).
And after the content is saved it can be restored when the editor is reloaded.

####How the Plugin works

The Plugin saves the content every 25 seconds (can be defined in the Config - `autosave_delay`), but only when the content has changed.

After content from the editor has been saved, if that page is loaded again then the saved content will be automatically injected into the editor for you.


![Screenshot](http://www.watchersnet.de/Portals/0/screenshots/dnn/AutoSaveDiffDialog.png)

####License

Licensed under the terms of the MIT License.

####Installation

 1. Extract the contents of the file into the "plugins" folder of CKEditor.
 2. In the CKEditor configuration file (config.js) add the following code:

````js
config.extraPlugins = 'autosave';
````

#####To Configure the Plugin the following options are available...


````js
config.autosave = {
      // Auto save Key - The Default autosavekey can be overridden from the config ...
      Savekey : "autosaveKey",

      // Ignore Content older then X
      //The Default Minutes (Default is 1440 which is one day) after the auto saved content is ignored can be overidden from the config ...
      NotOlderThen : 1440,

      // Save Content on Destroy - Setting to Save content on editor destroy (Default is false) ...
      saveOnDestroy : false,

      // Setting to set the Save button to inform the plugin when the content is saved by the user and doesn't need to be stored temporary ...
      saveDetectionSelectors : "a[href^='javascript:__doPostBack'][id*='Save'],a[id*='Cancel']",
     // Delay
     delay : 10,
};
````
