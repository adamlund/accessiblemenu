/**
 * Created by AdamLund on 5/8/17.
 */
var DropMenuManager = {

  init: function(context){
    var self = this;

    this.context = context || document;
    this.dropmenus = [];
    this.interaction = 'click';
    this.isOpen = false;

    this.context.addEventListener('click', function checkForOpenAndClose(event){

      self.dropmenus.forEach(function(dm){

        if(dm.isOpen() && event.target !== dm.trigger){

          if(!event.path.includes(dm.menuElement)){
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

  closeOthers: function(dropmenu){

    this.dropmenus.forEach(function(dm){
      if(dm !== dropmenu){
        dm.close();
      }
    });

  },

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

var DropMenu = {

  init: function(menuElement, trigger, interaction){

    var _self = this;

    _self.menuElement = menuElement;
    _self.trigger = trigger;
    _self.interaction = interaction || 'click';

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

    function ESCListener(keyevent){
      if(keyevent.keyCode === 27 || keyevent.which === 27){
        _self.close();
        _self.trigger.focus();
      }
    }

    _self.menuElement.addEventListener('keydown', ESCListener);

    return this;

  },
  toggle: function(){
    var _self = this;

    _self.trigger.getAttribute('aria-expanded') === "true" ? _self.close() : _self.open() ;

  },
  open: function(){

    var _self = this;

    _self.menuElement.style.position = 'absolute';
    _self.menuElement.style.top = (_self.trigger.offsetY + _self.trigger.offsetHeight + 20) + "px";
    _self.menuElement.style.left = _self.trigger.offsetX + "px";

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