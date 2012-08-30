// requestAnimationFrame polyfill by @rma4ok
!function (window) {
  var
      equestAnimationFrame = 'equestAnimationFrame',
      requestAnimationFrame = 'r' + equestAnimationFrame,

      ancelAnimationFrame = 'ancelAnimationFrame',
      cancelAnimationFrame = 'c' + ancelAnimationFrame,

      expectedTime = 0,
      vendors = ['moz', 'ms', 'o', 'webkit'],
      vendor;

  while (!window[requestAnimationFrame] && (vendor = vendors.pop())) {
    window[requestAnimationFrame] = window[vendor + 'R' + equestAnimationFrame];
    window[cancelAnimationFrame] =
        window[vendor + 'C' + ancelAnimationFrame] ||
            window[vendor + 'CancelR' + equestAnimationFrame];
  }

  if (!window[requestAnimationFrame]) {
    window[requestAnimationFrame] = function (callback) {
      var
          currentTime = +new Date,
          adjustedDelay = 16 - (currentTime - expectedTime),
          delay = adjustedDelay > 0 ? adjustedDelay : 0;

      expectedTime = currentTime + delay;

      return setTimeout(function () {
        callback(expectedTime);
      }, delay);
    };

    window[cancelAnimationFrame] = clearTimeout;
  }
}(this);


!function ($, window, undefined) {

  "use strict"; // jshint ;_;


  function extendClass(child, parent) {

    function Parent() {
      this.constructor = child;
      this.__super__ = parent.prototype;
    }

    Parent.prototype = parent.prototype;
    child.prototype = new Parent;
    return child;
  }


  // ----------------------------- Animation Class --------------------------------

  function Animation(options) {
    var that = this,
        animate;

    options = options || {};

    that.duration = (options.duration || 0) * 1000;

    that._prevState = 0;
    that._state = 0;
    that._start = 0;
    that._id = 0;

    that._reversed = false;

    //bind _animate
    animate = that._animate;
    that._animate = function (time) {
      animate.call(that, time);
    };
  }

  Animation.prototype = {
    constructor: Animation,


    play: function () {
      var that = this;


      if (that._state === 1)
        that.progress(0);

      that._reversed = false;
      that._run();

      return that;
    },

    reverse: function () {
      var that = this;

      if (that._state === 0)
        that.progress(1);

      this._reversed = true;
      this._run();

      return that;
    },

    pause: function () {
      cancelAnimationFrame(this._id);

      return this;
    },


    reset: function () {
      var that = this;

      that.pause();
      that._state = 0;
      that._reversed = false;

      return that;
    },


    progress: function (state) {
      var
          that = this,
          done = false;

      if (state === undefined) return that._state;

      //state should be in 0..1
      if (state < 0) {
        state = 0;
        done = true;
      }
      if (state > 1) {
        state = 1;
        done = true;
      }

      if (done)
        that.pause();

      that._prevState = that._state;
      that._state = state;
      that._render();

      return that;
    },

    _run: function () {
      var that = this,
          state = that._state;


      if (that._reversed)
        state = 1 - state;

      that._start = +new Date + that.duration * state;

      that.pause();
      that._animate();
    },

    _animate: function (time) {
      var
          that = this,
          state;

      time = time || +new Date;
      that._id = requestAnimationFrame(that._animate, document.body);

      state = (time - that._start) / that.duration;

      if (that._reversed)
        state = 1 - state;

      that.progress(state);
    },

    //abstract method
    _render : function (state) {
    }
  };


  // ---------------------------- TypingTween Class ----------------------------

  var
      NONE = 0,
      CHAR = 1,
      WORD = 2,
      MODES = {
        NONE: NONE,
        CHAR: CHAR,
        WORD: WORD
      };


  function TypingTween(options) {
    var that = this,
        $target,
        addMode,
        removeMode;

    options = options || {};

    that.__super__.constructor.call(that, options);

    $target = options.target;
    if (!$target.jquery)
      $target = $($target);
    that.target = $target;
    that.cursor = null;

    that._add = that._setMode(options.add);
    that._remove = that._setMode(options.remove);

    that._addQueue = $([]);
    that._removeQueue = $([]);

    that._prepare();

    that.play();
  }


  extendClass(TypingTween, Animation);
  $.extend(TypingTween.prototype, {

    _setMode: function (mode) {
      mode = (mode || '').toUpperCase().replace('S', '');

      if (mode in MODES)
        return MODES[mode];
      else {
        return NONE;
      }
    },

    _wrap: function ($el, splitter, cssClass, indexShift, separator, separateLines) {
      var count = 0;

      if (separator === undefined) separator = splitter;

      if ($el.children().is('br')) {
        count++;
        $el.html('<span class="' + cssClass + ' ' + indexShift + '">' +
            '<br></span>');
      }
      else
        $el.html(
            $.map(
                $el.text().split(splitter),
                function (item, i) {
                  count++;
                  return '<span class="' + cssClass + ' ' + (i + indexShift) + '">' +
                      item + separator +
                      '</span>'
                })
                .join(separateLines ? '<span><br></span>' : '')
        );

      return count;
    },

    _prepare: function () {
      var
          that = this,
          $target = that.target,
          $cursor,
          wrap = that._wrap,

          NEW_LINE_SPLIT = '_' + $target.text() + '=',

          _add = that._add,
          _remove = that._remove,
          $addQueue = that._addQueue,
          $removeQueue = that._removeQueue,

          $words, $chars,
          charIndex = 0;

      wrap($target.children('br').replaceWith(NEW_LINE_SPLIT).end(), NEW_LINE_SPLIT, 'line', 0, '', true);
      $target = $target.children();

      if (_add === WORD || _remove === WORD) {
        wrap($target, ' ', 'word', 0);
        $target = $words = $target.children();
      }

      if (_add === CHAR || _remove === CHAR) {
        $target.each(function (i, item) {
          charIndex += wrap($(item), '', 'char', charIndex);
        });
        $chars = $target.children();
      }

      that.cursor = $cursor = $('<span class="typing-tween-cursor animate">|</span>');
      that.target.append($cursor);

      if (_add === WORD) {
        $addQueue = $addQueue.add($words);
      }
      else if (_add === CHAR) {
        $addQueue = $addQueue.add($chars);
      }

      $addQueue.hide();
      that._addCount = $addQueue.length;
      that._addQueue = $addQueue;


      if (_remove === WORD) {
        $removeQueue = $removeQueue.add($words);
      }
      else if (_remove === CHAR) {
        $removeQueue = $removeQueue.add($chars);
      }


      that._removeCount = $removeQueue.length;
      that._removeQueue = $removeQueue;
    },

    //@override
    _render : function () {
      //this.__super__._render.call(that);

      var
          METHODS = ['show', 'hide'],

          that = this,

          $cursor = that.cursor,
          addCount = that._addCount,
          removeCount = that._removeCount,

          length = addCount + removeCount,

          from = ~~(length * that._prevState),
          i = from,
          to = ~~(length * that._state),

          reversed = from > to,
          changed = false,

          index;

      for (;
          reversed ? i > to : i < to;
          reversed ? i-- : i++) {

        index = i - reversed;

        if (index < addCount)
          that._addQueue.eq(index)[METHODS[+reversed]]();

        else
        //reversed lookup (removeCount  - (index - addCount) - 1)
          that._removeQueue.eq(removeCount + addCount - index - 1)[METHODS[1 - reversed]]();

        changed = true;
      }

      if (changed) {
        $cursor.toggleClass('animate');
        setTimeout(function () {
          $cursor.toggleClass('animate');
        }, 0);
      }
    }
  });

  $.fn.typingTween = function (options) {
    options = options || {};
    options.target = this;
    return new TypingTween(options)
  };

}(jQuery, this);