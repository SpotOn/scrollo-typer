!function ($) {

  "use strict"; // jshint ;_;

  //Private static
  var
      $window,
      windowHeight,
  //numbers
      ABOVE_ZERO = 1e-99,

  //singleton
      that = null;

  function Skrollex(options) {
    var
        getOffset;

    if (that) return that;
    that = this;

    $window = $(window);
    windowHeight = $window.height();

    options = options || {};

    if (getOffset = options.getOffset)
      that.getOffset = getOffset;

    that._mixes = [];
    that._offset = that.getOffset();

    $window
        .scroll(function () {
          that._animate();
        })
        .resize(function () {
          windowHeight = $window.height();
          that._onResize();
        });

    setTimeout(function () {
      that._animate();
    }, 0);
  }

  Skrollex.prototype = {
    constructor: Skrollex,


    getOffset: function () {
      return $window.height() / 2;
    },


    addMix: function (options) {
      var
          $target,
          offset,

          top,
          start,
          duration,
          anims,

          pin,
          pinDuration,
          pinOffset,
          pinStart,
          pinHeight,
          $pinPlaceholder;

      options = options || {};

      $target = options.target;
      if (!$target.jquery)
        $target = $($target);

      top = $target.offset().top;

      anims = options.animation || [];

      if (!$.isArray(anims))
        anims = [anims];

      $.each(anims, function (i, anim) {
        anim.state = 'BEFORE';

        anim.duration = duration = anim.duration || 0;
        anim.start = start = top + (anim.offset || 0);
        anim.end = start + duration;

        anim.tween.progress(ABOVE_ZERO).pause();
      });

      pin = options.pin;

      if (pin) {
        pin.pinned = 'BEFORE';
        pinDuration = pin.duration = pin.duration || 0;
        pinOffset = pin.offset = pin.offset || 0;
        pinStart = pin.start = top;
        pin.end = pinStart + pinDuration;

        pinHeight = pin.height = 'height' in pin ? pin.height : pinDuration;

        $pinPlaceholder = $('<div class=scrillex-pin-placeholder>').height(pinHeight + $target.outerHeight());
        pin._placeholder = $pinPlaceholder;

        $target.css({position: 'absolute', top: top}).after($pinPlaceholder);
      }

      this._mixes.push({
        target: $target,
        anims : anims,
        pin   : pin
      });
    },

    addTyping: function () {
    },

    _onResize: function () {
      that._offset = this.getOffset();
    },

    _animate: function () {
      var
          scroll = $window.scrollTop(),
          scrollWithOffset,

          mixes = that._mixes,
          mix,

          $target,
          pin,
          pinned,

          anims, anim, tween, onStateChange,
          duration, start, end, offset,
          $pusher,
          state,
          i, l,
          j, ll;


      for (i = 0, l = mixes.length; i < l; i++) {
        mix = mixes[i];

        $target = mix.target;
        pin = mix.pin;
        scrollWithOffset = scroll + (pin ? 0 : that._offset);

        if (pin) {
          pinned = pin.pinned;
          start = pin.start;
          end = pin.end;
          offset = pin.offset;

          scrollWithOffset += pin.offset;

//          console.log(start, end, offset, scroll, scrollWithOffset);

          if (pinned !== 'IN_PROGRESS' && scrollWithOffset > start && scrollWithOffset < end) {
            $target.css({position: 'fixed', top: offset});
            pin.pinned = 'IN_PROGRESS';
          }
          else if (pinned !== 'AFTER' && scrollWithOffset >= end) {
            $target.css({position: 'absolute', top: end});
            pin.pinned = 'AFTER';
          }
          else if (pinned !== 'BEFORE' && scrollWithOffset <= start) {
            $target.css({position: 'absolute', top: start});
            pin.pinned = 'BEFORE';
          }

        }


        anims = mix.anims;


        for (j = 0, ll = anims.length; j < ll; j++) {
          anim = anims[j];

          duration = anim.duration;
          start = anim.start;
          end = anim.end;

          state = anim.state;

          tween = anim.tween;
          onStateChange = anim.onStateChange;

          if (scrollWithOffset > start && scrollWithOffset < end) {
            tween.progress((scrollWithOffset - start) / duration).pause();
            if(onStateChange && anim.state !== 'IN_PROGRESS'){
              onStateChange(anim.state, 'IN_PROGRESS');
            }
            anim.state = 'IN_PROGRESS';
          }
          else if (state !== 'AFTER' && scrollWithOffset >= end) {
            if (scrollWithOffset - end > windowHeight || duration)
              tween.progress(1).pause();
            else
              tween.play();
            if(onStateChange){
              onStateChange(anim.state, 'AFTER');
            }
            anim.state = 'AFTER';
          }
          else if (state !== 'BEFORE' && scrollWithOffset <= start) {
            if (start - scrollWithOffset > windowHeight || duration)
              tween.progress(ABOVE_ZERO).pause();
            else
              tween.reverse();
            if(onStateChange){
              onStateChange(anim.state, 'BEFORE');
            }
            anim.state = 'BEFORE';
          }
        }
      }

    }
  };

  $.skrollex = function (options) {
    return new Skrollex(options);
  };

  $.fn.skrollex = function (options) {
    options.target = this;
    new Skrollex().addMix(options);
    return this;
  };

}(jQuery);