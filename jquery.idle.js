/**
 *  File: jquery.idle.js
 *  Title:  JQuery Idle.
 *  A dead simple jQuery plugin that executes a callback function if the user is idle.
 *  About: Author
 *  Henrique Boaventura (hboaventura@gmail.com).
 *  About: Version
 *  1.2.7
 *  About: License
 *  Copyright (C) 2013, Henrique Boaventura (hboaventura@gmail.com).
 *  MIT License:
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *  - The above copyright notice and this permission notice shall be included in all
 *    copies or substantial portions of the Software.
 *  - THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *    SOFTWARE.
 **/
/*jslint browser: true */
/*global jQuery: false */



(function ($) {
  'use strict';
  $.fn.idle = function (options) {
    var defaults = {
        idle: 60000, //idle time in ms
        events: 'mousemove keydown mousedown touchstart wheel', //events that will trigger the idle resetter
        onIdle: function () {}, //callback function to be executed after idle time
        onActive: function () {}, //callback function to be executed after back from idleness
        onHide: function () {}, //callback function to be executed when window is hidden
        onShow: function () {}, //callback function to be executed when window is visible
        keepTracking: true, //set it to false if you want to track only the first time
        startAtIdle: false,
        recurIdleCall: true
      },
      idle = options.startAtIdle || false,
      visible = !options.startAtIdle || true,
      settings = $.extend({}, defaults, options),
      lastId = null,
      resetTimeout,
      timeout;

    //event to clear all idle events
    $(this).on( "idle:stop", {}, function( event) {
      $(this).off(settings.events);
      settings.keepTracking = false;
      resetTimeout(lastId, settings);
    });

    resetTimeout = function (id, settings) {
      const now = new Date().getTime();
      localStorage.setItem('lastActivityTime', new Date(now).toString());

      if (idle) {
        idle = false;
        settings.onActive.call();
      }
      clearTimeout(id);
      if(settings.keepTracking) {
        return timeout(settings);
      }
    };

    timeout = function (settings) {
      const configTimeout = window.javaScriptGlobalConst.authentication.inactivityTimerInSeconds;
      let timer = (settings.recurIdleCall ? setInterval : setTimeout), id;
      let storedDateString = localStorage.getItem('lastActivityTime');
      let storedDate = new Date(storedDateString);
      let idleTime = new Date(storedDate);
      idleTime.setSeconds(idleTime.getSeconds() + configTimeout); // set num seconds for timeout
      id = timer(() => {
        idle = true;

        if (new Date() > idleTime) {
          // re-check other tabs
          let reCheckStoredDate = new Date(localStorage.getItem('lastActivityTime'));
          let reCheckIdleTime = reCheckStoredDate.setSeconds(reCheckStoredDate.getSeconds() + configTimeout); // set num seconds for timeout
          
          if (new Date() > reCheckIdleTime) {
            settings.onIdle.call();
          }
          else {
            (idleTime = reCheckIdleTime);
          }
        }
      }, settings.idle);
      return id;
    };

    return this.each(function () {
      lastId = timeout(settings);
      $(this).on(settings.events, function (e) {
        lastId = resetTimeout(lastId, settings);
      });
      if (settings.onShow || settings.onHide) {
        $(document).on("visibilitychange webkitvisibilitychange mozvisibilitychange msvisibilitychange", function () {
          if (document.hidden || document.webkitHidden || document.mozHidden || document.msHidden) {
            if (visible) {
              visible = false;
              settings.onHide.call();
            }
          } else {
            if (!visible) {
              visible = true;
              settings.onShow.call();
            }
          }
        });
      }
    });

  };
}(jQuery));
