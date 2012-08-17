!function ($) {

  "use strict"; // jshint ;_;

  //Private static
  var
      $window,
      windowHeight,
  //numbers
      ABOVE_ZERO = 1e-99,

  //states
      BEFORE = 0,
      IN_PROGRESS = 1,
      AFTER = 2,

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

    that._counter = 0;

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
      start = top - (options.offset || 0);
      duration = options.duration || 0;

      anims = options.anim || [];

      if (!$.isArray(anims))
        anims = [anims];

      $.each(anims, function (i, anim) {
        anim.progress(ABOVE_ZERO).pause();
      });

      pin = options.pin;

      if (pin) {
        pin.pinned = BEFORE;
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
        target  : $target,
        anims   : anims,
        duration: duration,
        start   : start,
        end     : start + duration,
        state   : BEFORE,
        pin     : pin
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

          anims,
          duration, start, end, offset, height,
          $pusher,
          state,
          i, l,
          j, ll;


      for (i = 0, l = mixes.length; i < l; i++) {
        that._counter++;
        mix = mixes[i];

        $target = mix.target;
        pin = mix.pin;
        scrollWithOffset = scroll + (pin ? 0 : that._offset);

        if (pin) {
          pinned = pin.pinned;
          start = pin.start;
          end = pin.end;
          offset = pin.offset;
          height = pin.height;

          scrollWithOffset += pin.offset;

//          console.log(start, end, offset, scroll, scrollWithOffset);

          if (pinned !== IN_PROGRESS && scrollWithOffset > start && scrollWithOffset < end) {
            $target.css({position: 'fixed', top: offset});
            pin.pinned = IN_PROGRESS;
          }
          else if (pinned !== AFTER && scrollWithOffset > end) {
            $target.css({position: 'absolute', top: start + height});
            pin.pinned = AFTER;
          }
          else if (pinned !== BEFORE && scrollWithOffset < start) {
            $target.css({position: 'absolute', top: start});
            pin.pinned = BEFORE;
          }

        }


        anims = mix.anims;

        duration = mix.duration;
        start = mix.start;
        end = mix.end;

        state = mix.state;

        if (scrollWithOffset > start && scrollWithOffset < end) {

          for (j = 0, ll = anims.length; j < ll; j++) {
            anims[j].progress((scrollWithOffset - start) / duration).pause();
          }
          mix.state = IN_PROGRESS;
        }
        else if (state !== AFTER && scrollWithOffset > end) {
          for (j = 0, ll = anims.length; j < ll; j++) {
            if (scrollWithOffset - end > windowHeight || duration)
              anims[j].progress(1).pause();
            else
              anims[j].play();
          }
          mix.state = AFTER;
        }
        else if (state !== BEFORE && scrollWithOffset < start) {
          for (j = 0, ll = anims.length; j < ll; j++) {
            if (start - scrollWithOffset > windowHeight || duration)
              anims[j].progress(ABOVE_ZERO).pause();
            else
              anims[j].reverse();
          }
          mix.state = BEFORE;
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