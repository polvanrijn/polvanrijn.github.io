/* ========================================================================
 * international-keyboards - v0.12.0
 * ========================================================================
 * Copyright 2022 Pol van Rijn
 *
 * ========================================================================
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================================
 */


/*jshint strict:false */
/* global console, define, require, module, jQuery, $ */
/*jshint esversion: 8 */

$.fn.extend({
    disableSelection: function () {
        this.each(function () {
            if (typeof this.onselectstart !== 'undefined') {
                this.onselectstart = function () {
                    return false;
                };
            } else if (typeof this.style.MozUserSelect !== 'undefined') {
                this.style.MozUserSelect = 'none';
            } else {
                this.onmousedown = function () {
                    return false;
                };
            }
        });
    }
});


const AVAILABLE_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Backquote', 'Backslash', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'];
const KEYBOARD_TYPES = ['ANSI', 'ISO', 'JIS'];
const KEY_VARIANTS = ['upper', 'lower'];
const CSS_STYLES = ['inverted', 'default', 'apple'];
(function (window, factory) {
    if (typeof define === 'function' && define.amd) {
        return define(['jquery'], function (jQuery) {
            return window.InternationalKeyboard = factory(jQuery);
        });
    } else if (typeof exports === 'object') {
        return module.exports = factory(require('jquery'));
    } else {
        return window.InternationalKeyboard = factory(window.jQuery);
    }
})
(window, function ($) {
    var InternationalKeyboard, document;
    document = window.document;
    InternationalKeyboard = (function () {
        function InternationalKeyboard(options) {
            this._options = $.extend({
                keyboardID: undefined,
                containerID: 'keyboard',
                keyboardType: 'ANSI',
                addLatinKeys: false,
                showKeys: AVAILABLE_KEYS,
                keyVariant: 'lower',
                cssStyle: 'inverted',
            }, options);
            var keyboard = this;
            if (keyboard._options.keyboardType === undefined || KEYBOARD_TYPES.indexOf(keyboard._options.keyboardType) === -1) {
                throw new Error('Unsupported keyboard style: ' + keyboard._options.keyboardType);
            }
            if (keyboard._options.keyVariant === undefined || KEY_VARIANTS.indexOf(keyboard._options.keyVariant) === -1) {
                throw new Error('Unsupported key variant: ' + keyboard._options.keyVariant);
            }
            if (keyboard._options.cssStyle === undefined || CSS_STYLES.indexOf(keyboard._options.cssStyle) === -1) {
                throw new Error('Unsupported CSS style: ' + keyboard._options.cssStyle);
            }
            keyboard.createKeyboard();
        }

        InternationalKeyboard.prototype.createKeyboard = async function () {
            this.loadKeyboard(this._options.keyboardType, 'keyboard', this._options.cssStyle);
            this.insertKeyLabels(this._options.keyboardID, this._options.cssStyle);
        };

        InternationalKeyboard.prototype.loadKeyboard = async function (keyboardType, containerID) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "keyboards/" + keyboardType + ".svg", false);
            // Following line is just to be on the safe side;
            // not needed if your server delivers SVG with correct MIME keyboardType
            xhr.overrideMimeType("image/svg+xml");
            xhr.onload = function (e) {
                // You might also want to check for xhr.readyState/xhr.status here
                document.getElementById(containerID)
                    .appendChild(xhr.responseXML.documentElement);
            };
            xhr.send("");
        };

        InternationalKeyboard.prototype.insertKeyLabels = async function (keyboardID, cssStyle) {
            var keyboard = this;
            $('svg path').each(function () {
                $(this).attr('class', 'key ' + cssStyle);
            });
            await $.ajax({
                dataType: "json",
                url: 'json/' + keyboardID + '.json',
                success: function (data) {
                    for (const [key, value] of Object.entries(data)) {
                        var path = $('#' + key);
                        if (path.length === 0) {
                            console.log('key not found: ' + key);
                            continue;
                        }
                        if (keyboard._options.showKeys.indexOf(key) === -1) {
                            continue;
                        }
                        path[0].classList.add('active-key');
                        path[0].classList.add(cssStyle);
                        var bbox = path[0].getBBox();
                        var keyText = value[keyboard._options.keyVariant];
                        var keyElement = document.getElementById((path.parent()[0].id));
                        var attributes = 'text-anchor="middle" alignement-baseline="middle"';
                        var x, y, classes;
                        var showLatinKey = false;
                        var latinKey;
                        if (keyboard._options.addLatinKeys === true) {
                            if (key.startsWith('Key') || key.startsWith('Digit')) {
                                latinKey = key.replace('Key', '').replace('Digit', '');
                                if (latinKey.toUpperCase() !== keyText.toUpperCase()) {
                                    showLatinKey = true;
                                }
                            }
                        } else {
                            if (key.indexOf('Key') !== -1) {
                                keyText = keyText.toUpperCase();
                            }

                        }
                        if (showLatinKey) {
                            classes = 'keyLabel small ' + cssStyle + ' label-' + key;
                            x = bbox.x + bbox.width / 4;
                            y = bbox.y + bbox.height / 4 + 20;
                            keyElement.appendChild($('<text x="' + x + '" y="' + y + '" ' + attributes + ' class="' + classes + '">' + latinKey + '</text>')[0]);
                            x = bbox.x + 3 * bbox.width / 4 - 10;
                            y = bbox.y + 3 * bbox.height / 4 + 20 - 10;
                            keyElement.appendChild($('<text x="' + x + '" y="' + y + '" ' + attributes + ' class="' + classes + '">' + keyText + '</text>')[0]);
                        } else {
                            classes = 'keyLabel ' + cssStyle + ' label-' + key;
                            x = bbox.x + bbox.width / 2;
                            y = bbox.y + bbox.height / 2 + 20;
                            keyElement.appendChild($('<text x="' + x + '" y="' + y + '" ' + attributes + ' class="' + classes + '">' + keyText + '</text>')[0]);
                        }
                    }
                    var container = $("#" + keyboard._options.containerID);
                    container.html(container.html());
                }
            });
        };
        InternationalKeyboard.prototype.press = function (key, duration = 300) {
            var keyboard = this;
            keyboard.hold(key);
            setTimeout(function () {
                keyboard.release(key);
            }, duration);
        };

        InternationalKeyboard.prototype.getKey = function (key) {
            var path = $('#' + key);
            if (path.length === 0) {
                console.log('key not found: ' + key);
                return;
            }
            return path;
        };

        InternationalKeyboard.prototype.hold = function (key, className = 'press') {
            this.getKey(key).addClass(className);
            $('.label-' + key).addClass(className);
        };

        InternationalKeyboard.prototype.release = function (key, className = 'press') {
            this.getKey(key).removeClass(className);
            $('.label-' + key).removeClass(className);
        };

        InternationalKeyboard.prototype.highlight = function (key) {
            this.hold(key, 'highlight');
        };

        return InternationalKeyboard;

    })();
    return InternationalKeyboard;
});