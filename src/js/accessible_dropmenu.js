/**
 AccessibleDropMenu Menu (accessibility menu)
 Version: 1.0.1-alpha-1

 License: MIT
 Author: Adam Lund (lundmn@gmail.com)
 **/
var ARIADropDownMenu = function(options){

  this.trigger       = null;
  this.dialog        = null;
  this.click_handler = null;
  this.key_handler   = null;

  this.STATES        = Object.freeze({
    "CLOSING" : -1,
    "CLOSED"  : 0,
    "OPEN"    : 1,
    "OPENING" : 2
  });
  this.myState       = this.STATES.CLOSED;

  this.KEYMAP = {
    'TAB'      :  9,
    'RETURN'   : 13,
    'ESC'      : 27,
    'SPACE'    : 32,
    'PAGEUP'   : 33,
    'PAGEDOWN' : 34,
    'END'      : 35,
    'HOME'     : 36,
    'LEFT'     : 37,
    'UP'       : 38,
    'RIGHT'    : 39,
    'DOWN'     : 40
  };

  this.MASTERSELECTOR = "a[href]:not([disabled]):not([tabindex='-1']),\
        input:not([type='hidden']):not([disabled]):not([tabindex='-1']),\
        button:not([disabled]):not([tabindex='-1']),\
        select:not([disabled]):not([tabindex='-1']),\
        textarea:not([disabled]):not([tabindex='-1']),\
        iframe:not([tabindex='-1']),\
        [tabindex]:not([tabindex='-1']),\
        [contentEditable=true]:not([tabindex='-1'])";

  this._opts         = {

    /*
     Selector for the menu trigger, which specifies the ID of the menu element.
     This allows the element to be placed anywhere in the DOM, or created on the fly.

     <button aria-controls="Menu_ID_1">Menu One</button>
     <button aria-controls="Menu_ID_2"Menu Two</button>

     <div id="MENU_ID_1">This is the first menu</div>
     <div id="MENU_ID_2">This is the second menu</div>
     */
    menuElementAttribute  : 'aria-controls',

    /*
     Visibility CSS class toggles
     classToggleOn=show and classToggleOff=hide
     styles should at a minimum have 'display: none' and 'display: block'
     */
    classToggleOn     : 'menu_show',
    classToggleOff    : 'menu_hide',

    menuZindex        : '1000',

    /*
     closeOn -- element selector to attach click handler for close action of the dialog
     */
    closeOn          : '[data-menu-close]',

    /*
     focusOnFirst -- element selector to force focus on when the menu first appears
     default is to use the close button, could also be a class within the dialog
     */
    focusOnFirst      : '[data-menu-close]',

    beforeShow        : null,
    afterShow         : null,
    beforeClose       : null,
    afterClose        : null,

    /*
     Blocker Settings. The blocker is a div with click listener to close the menu
     for blockerStyles
     */
    blockerId        : 'blocker',
    blockerStyles     : {
      "position"        : "fixed",
      "display"         : "block",
      "top"             : "0",
      "bottom"          : "0",
      "left"            : "0",
      "right"           : "0",
      "background-color" : "#ffffff",
      "opacity"         : "0.0",
      "z-index"         : "100"
    }
  };

  this.extend = function(destination, source) {
    var _self = this;
    for (var property in source) {
      if (destination.hasOwnProperty(property) && source.hasOwnProperty(property)) {
        if(typeof source[property] === 'object') { // if it's an object itself
          _self.extend(destination[property], source[property]);
        }
        else {
          destination[property] = source[property];
        }
      }
    }
    return destination;
  };

  this._opts = this.extend(this._opts, options);

};

ARIADropDownMenu.prototype.getOpts = function(){
  return this._opts;
};

ARIADropDownMenu.prototype.isOpen = function() {

  if(typeof this.dialog === "undefined" || this.dialog === null){
    return false;
  }
  else if(this.dialog.getAttribute('open') === 'true' || (this.dialog.getAttribute('open') === 'open')){
    return true;
  }
  return false;

};

ARIADropDownMenu.prototype._swapClass = function(el, addClass, removeClass) {
  if (el.classList && removeClass) {
    el.classList.add(addClass);
    el.classList.remove(removeClass);
  }
  else {
    el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    el.className += ' ' + addClass;
  }
};

ARIADropDownMenu.prototype.closeDialog = function() {

  var _self = this;

  this.myState = this.STATES.CLOSING;

  if(this._opts.beforeClose !== null && typeof this._opts.beforeClose === 'function')
    this._opts.beforeClose(_self);

  var blocker = document.getElementById(this._opts.blockerId);

  // remove dialog attributes
  this.dialog.removeAttribute('open');
  this.dialog.removeAttribute('role');
  this.dialog.removeAttribute('aria-describedby');
  this.dialog.removeAttribute('tabindex');
  this.dialog.setAttribute('aria-hidden', 'true');

  this._swapClass(this.dialog, this._opts.classToggleOff, this._opts.classToggleOn);

  this.trigger.setAttribute('aria-haspopup', 'true');
  this.trigger.setAttribute('aria-expanded', 'false');

  // Show if the css does not contain the display attribute
  if(window.getComputedStyle(this.dialog,null).getPropertyValue("display") !== "none")
    this.dialog.style.display = "none";

  this.dialog.style.zIndex = null;

  this.dialog.removeEventListener('keydown', this.key_handler, false);
  this.dialog.querySelector(this._opts.closeOn).removeEventListener('click', this.click_handler, false);
  document.getElementById(this._opts.blockerId).removeEventListener('click', this.click_handler, false);

  this.key_handler = null;
  this.click_handler = null;

  if(blocker)
    blocker.parentNode.removeChild(document.getElementById(this._opts.blockerId));

  this.trigger.focus();

  if(this._opts.afterClose !== null && typeof this._opts.afterClose === 'function')
    this._opts.afterClose(_self);

  this.trigger       = null;
  this.dialog        = null;
  this.myState = this.STATES.CLOSED;
};

ARIADropDownMenu.prototype.showDialog = function(trigger){
  var _self = this,
   blockerStyles = "",
   dialogId;

  // exit if in process of being called
  if(this.myState === this.STATES.CLOSING || this.myState === this.STATES.OPENING) {
    throw new Error("Multiple concurrent requests being made to open or close the A11yDropMenu");
  }

  this.myState = this.STATES.OPENING;

  if(typeof _self._opts.beforeShow === 'function' && _self._opts.beforeShow !== null)
    _self._opts.beforeShow(_self);

  this.trigger = trigger;

  // check for trigger and menu elements in DOM
  if(typeof trigger === "undefined" || trigger === null) {
    throw new Error("Trigger element not provided: provide a reference to the link or button triggering the menu to be opened");
  }

  dialogId = trigger.getAttribute(_self._opts.menuElementAttribute);

  if (typeof dialogId === "undefined" || dialogId === null || document.getElementById(dialogId) === null ) {
    throw new Error("Menu element not available in DOM, use attribue "+this._opts.menuElementAttribute+" in trigger element and reference the menu element ID as value");
  }

  this.dialog = document.getElementById(dialogId);

  this.dialog.setAttribute('tabindex'     , '0');
  this.dialog.setAttribute('open'         , 'true');
  this.dialog.setAttribute('role'         , 'dialog');
  this.dialog.setAttribute('aria-hidden'  , 'false');

  /*
   Locate the element which serves as the aria label
   set an ID on that element
   set the aria-labelledby to that id
   if no id exists that's ok, we'll create one
   */
  var arialabelElem = this.dialog.querySelector('[data-aria-label]');

  if(arialabelElem) {

    if(!arialabelElem.id) {
      arialabelElem.setAttribute('id',  "a11ymenu_id_"+Math.floor(Math.random() * (10000 - 0)) );
    }
    this.dialog.setAttribute('aria-labelledby', arialabelElem.id);

  }

  // This class injection should control size and placement on x/y axis
  this._swapClass(this.dialog, this._opts.classToggleOn, this._opts.classToggleOff);

  this.dialog.style.zIndex = _self._opts.menuZindex;
  this.trigger.setAttribute('aria-haspopup','dialog');
  this.trigger.setAttribute('aria-expanded','true');

  this.click_handler = function() {
    _self.closeDialog();
  };

  var closebutn = this.dialog.querySelector(_self._opts.closeOn);
  closebutn.addEventListener('click', this.click_handler);

  // make the blocker -- if clicked will close the menu
  for(var style in this._opts.blockerStyles){
    blockerStyles += style+":"+this._opts.blockerStyles[style]+';';
  }

  var blockerdiv = document.createElement("div");
  blockerdiv.setAttribute('style', blockerStyles);
  blockerdiv.id = _self._opts.blockerId ;
  blockerdiv.addEventListener('click', this.click_handler);

  // Append blocker as sibling of dialog
  // This is to prevent z-index layering problems with sticky elements
  this.dialog.parentElement.appendChild(blockerdiv);

  // Show if the css does not contain the display attribute
  if(window.getComputedStyle(this.dialog,null).getPropertyValue("display") === "none")
    this.dialog.style.display = "block";

  this.key_handler = function(kevent){

    switch(kevent.keyCode){

      case _self.KEYMAP.ESC:
        _self.closeDialog();
        kevent.preventDefault();
        break;

     /* Iterate over all the interactive and focusable elements in the menu */
      case _self.KEYMAP.TAB:

        var elems = Array.prototype.slice.call(_self.dialog.querySelectorAll( _self.MASTERSELECTOR )) || [ _self.dialog ];

        // remove non-visible but selectable elements
        elems = elems.filter(function(el){ return !!( el.offsetWidth || el.offsetHeight || el.getClientRects().length ); })

        // Catch SHIFT+TAB when on the first element
        if(kevent.shiftKey && document.activeElement == elems[0]){ //first element
          elems[elems.length-1].focus();
          kevent.preventDefault();
        }
        // Catch TAB when on last element, loop to top
        else if ( document.activeElement == elems[elems.length-1] && !kevent.shiftKey) { //last
          elems[0].focus();
          kevent.preventDefault();
        }
        break;
    }

  };

  this.dialog.addEventListener('keydown', this.key_handler);

  /*  Selector to set focus on element in menu when it appears
   Default is an element with attribute 'data-menu-close'
   override the option to provide a custom selector
   closeOn : 'close-button-selector'
   */
  this.dialog.querySelector( _self._opts.focusOnFirst ).focus();

  if(_self._opts.afterShow !== null && typeof _self._opts.afterShow === 'function')
    _self._opts.afterShow(_self);

  this.myState = this.STATES.OPEN;

};

ARIADropDownMenu.prototype.toggle = function(trigger){

  var _self = this;

  // if the dialog is not initialized, nothing there, then just show it
  if(!this.isOpen()){
    this.showDialog(trigger);
    return false;
  }

  // if the dialog is showing AND toggle being called on it again, close it
  if (_self.dialog.id === trigger.getAttribute(_self._opts.menuElementAttribute) ){
    _self.closeDialog();
    return;
  }

  // if the dialog is showing AND the element being asked for is different, close the old one and open the new one
  _self.closeDialog();
  this.showDialog(trigger);

};

ARIADropDownMenu.prototype.getDialogId = function(){
  if(this.dialog === null || typeof this.dialog.id === "undefined") {
    return null;
  }
  return this.dialog.id;
};

ARIADropDownMenu.prototype.addToggleHandler = function(triggerElement, handlerType){
  var _self = this;

  handlerType = "click" || handlerType;

  triggerElement.setAttribute("aria-haspopup", "true");
  triggerElement.setAttribute("aria-expanded", "false");

  triggerElement.addEventListener(handlerType, function(){
    _self.toggle(triggerElement);
  });

  return this;
};
