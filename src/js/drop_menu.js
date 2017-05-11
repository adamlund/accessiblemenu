/**
 * Created by AdamLund on 5/8/17.
 */
/**
 * DropMenuManager controls a group of menus.
 * A manager is needed to keep track of what menu is open and to close the menus when needed.
 * Only one menu can be open in a given context.
 * @type {{init: DropMenuManager.init, closeAll: DropMenuManager.closeAll, closeOthers: DropMenuManager.closeOthers, makeClickDropMenu: DropMenuManager.makeClickDropMenu}}
 */
var DropMenuManager = {

  init: function(context){
    var self = this;

    this.context = context || document;
    this.dropmenus = [];
    this.interaction = 'click';
    this.isOpen = false;

    /*
     Click handler for when menu is open.
     This is in place of a blocker.
     */
    this.context.addEventListener('click', function checkForOpenAndClose(event){

      self.dropmenus.forEach(function(dm){

        // Add exceptions here for clickable elements you don't want to close the menu
        // for example, elements user can click as drag targets
        if(dm.isOpen() && event.target !== dm.trigger){
          if(! dm.menuElement.contains(event.target)){
            dm.close();
          }
        }

      });
    });
  },

  closeAll: function(){
    if(this.dropmenus) {
      this.dropmenus.forEach(function(dm){
        if(dm.isOpen()){
          dm.close();
        }
      });
    }
  },
  /**
   * Close all menus other than one provided
   * @param dropmenu
   */
  closeOthers: function(dropmenu){

    this.dropmenus.forEach(function(dm){
      if(dm !== dropmenu){
        dm.close();
      }
    });

  },

  /**
   * Factory pattern to make DropMenus and register with the manager
   * @param menuElement - element containing the menu contents
   * @param trigger - a button element that opens and closes the menu on click
   * @returns DropMenu reference
   */
  makeClickDropMenu: function(menuElement, trigger){
    var _self = this;

    var dm = DropMenu.generate(menuElement, trigger, 'click');

    dm.menuElement.addEventListener('menuopen', function(evt){
      _self.closeOthers(dm);
    });

    this.dropmenus.push( dm );

    return dm;
  }
};

/**
 * DropMenu
 * Adds ARIA to a menu ands its triggering element (button)
 * @type {{init: DropMenu.init, toggle: DropMenu.toggle, open: DropMenu.open, close: DropMenu.close, isOpen: DropMenu.isOpen, generate: DropMenu.generate}}
 */
var DropMenu = {

  init: function(menuElement, trigger, interaction){

    var _self = this;

    _self.menuElement = menuElement;
    _self.trigger = trigger;
    _self.interaction = interaction || 'click';
    _self.h_align = 'left';     // default align menu to left edge of trigger
    _self.v_align = 'bottom';   // default align menu to bottom edge of trigger

    _self.SELECTABLES = "a[href]:not([disabled]):not([tabindex='-1']),\
        input:not([type='hidden']):not([disabled]):not([tabindex='-1']),\
        button:not([disabled]):not([tabindex='-1']),\
        select:not([disabled]):not([tabindex='-1']),\
        textarea:not([disabled]):not([tabindex='-1']),\
        iframe:not([tabindex='-1']),\
        [tabindex]:not([tabindex='-1']),\
        [contentEditable=true]:not([tabindex='-1'])";

    _self.trigger.addEventListener(_self.interaction, function(clickEvent){
      _self.toggle();
    });

    _self.trigger.setAttribute('aria-haspopup', 'true');

    /**
     * Close on press of ESC key
     */
    function ESCListener(keyevent){
      if(keyevent.keyCode === 27 || keyevent.which === 27){
        _self.close();
        _self.trigger.focus();
      }
    }

    _self.menuElement.addEventListener('keydown', ESCListener);

    return this;

  },
  setHorizontalAlignment: function(align){
    //if(align === 'left' || align === 'right' || align === 'middle')
      this.h_align = align;
  },
  toggle: function(){
    var _self = this;

    _self.trigger.getAttribute('aria-expanded') === "true" ? _self.close() : _self.open() ;

  },
  open: function(){

    var _self = this;

    _self.menuElement.style.position = 'absolute';

    // TODO improve the default positioning for the menu
    _self.menuElement.style.top = (_self.trigger.offsetY + _self.trigger.offsetHeight + 20) + "px";

    switch(_self.h_align){

      case 'right':
        _self.menuElement.style.right = "0px"; //_self.trigger.getClientRects()[0].left + "px";
        break;

      case 'left':
        _self.menuElement.style.left = "0px";
        break;

      case 'middle':
        var x = -(_self.trigger.getClientRects()[0].width / 2); //_self.trigger.getClientRects()[0].left;

        _self.menuElement.style.left = x + "px";
        break;
    }


    _self.trigger.setAttribute('aria-expanded', 'true');

    _self.menuElement.querySelectorAll( _self.SELECTABLES ).item(0).focus();
    _self.menuElement.dispatchEvent(new Event('menuopen'));

  },
  close: function(){
    this.trigger.setAttribute('aria-expanded', "false");
  },
  isOpen: function(){
    return this.trigger.getAttribute('aria-expanded') === "true" ? true : false;
  },
  generate: function(menuElement, trigger, type){
    return Object.create(DropMenu).init(menuElement, trigger, type);
  }

};