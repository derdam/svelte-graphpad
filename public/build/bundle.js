
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /**
     * vis-network - network
     * http://visjs.org/
     *
     * A dynamic, browser-based visualization library.
     *
     * @version 6.5.0
     * @date    2019-12-22T21:14:59Z
     *
     * @copyright (c) 2011-2017 Almende B.V, http://almende.com
     * @copyright (c) 2018-2019 visjs contributors, https://github.com/visjs
     *
     * @license 
     * vis.js is dual licensed under both
     *
     *   1. The Apache 2.0 License
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     *   and
     *
     *   2. The MIT License
     *      http://opensource.org/licenses/MIT
     *
     * vis.js may be distributed under either license.
     */
    var t="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function e(){throw new Error("Dynamic requires are not currently supported by rollup-plugin-commonjs")}function i(t,e){return t(e={exports:{}},e.exports),e.exports}var n=function(t){return t&&t.Math==Math&&t},o=n("object"==typeof globalThis&&globalThis)||n("object"==typeof window&&window)||n("object"==typeof self&&self)||n("object"==typeof t&&t)||Function("return this")(),r=function(t){try{return !!t()}catch(t){return !0}},s=!r((function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a})),a={}.propertyIsEnumerable,h=Object.getOwnPropertyDescriptor,l={f:h&&!a.call({1:2},1)?function(t){var e=h(this,t);return !!e&&e.enumerable}:a},d=function(t,e){return {enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}},u={}.toString,c=function(t){return u.call(t).slice(8,-1)},f="".split,p=r((function(){return !Object("z").propertyIsEnumerable(0)}))?function(t){return "String"==c(t)?f.call(t,""):Object(t)}:Object,v=function(t){if(null==t)throw TypeError("Can't call method on "+t);return t},y=function(t){return p(v(t))},g=function(t){return "object"==typeof t?null!==t:"function"==typeof t},m=function(t,e){if(!g(t))return t;var i,n;if(e&&"function"==typeof(i=t.toString)&&!g(n=i.call(t)))return n;if("function"==typeof(i=t.valueOf)&&!g(n=i.call(t)))return n;if(!e&&"function"==typeof(i=t.toString)&&!g(n=i.call(t)))return n;throw TypeError("Can't convert object to primitive value")},b={}.hasOwnProperty,w=function(t,e){return b.call(t,e)},_=o.document,k=g(_)&&g(_.createElement),x=function(t){return k?_.createElement(t):{}},O=!s&&!r((function(){return 7!=Object.defineProperty(x("div"),"a",{get:function(){return 7}}).a})),S=Object.getOwnPropertyDescriptor,M={f:s?S:function(t,e){if(t=y(t),e=m(e,!0),O)try{return S(t,e)}catch(t){}if(w(t,e))return d(!l.f.call(t,e),t[e])}},E=/#|\.prototype\./,D=function(t,e){var i=C[T(t)];return i==A||i!=P&&("function"==typeof e?r(e):!!e)},T=D.normalize=function(t){return String(t).replace(E,".").toLowerCase()},C=D.data={},P=D.NATIVE="N",A=D.POLYFILL="P",I=D,F={},N=function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function");return t},j=function(t,e,i){if(N(t),void 0===e)return t;switch(i){case 0:return function(){return t.call(e)};case 1:return function(i){return t.call(e,i)};case 2:return function(i,n){return t.call(e,i,n)};case 3:return function(i,n,o){return t.call(e,i,n,o)}}return function(){return t.apply(e,arguments)}},z=function(t){if(!g(t))throw TypeError(String(t)+" is not an object");return t},L=Object.defineProperty,R={f:s?L:function(t,e,i){if(z(t),e=m(e,!0),z(i),O)try{return L(t,e,i)}catch(t){}if("get"in i||"set"in i)throw TypeError("Accessors not supported");return "value"in i&&(t[e]=i.value),t}},B=s?function(t,e,i){return R.f(t,e,d(1,i))}:function(t,e,i){return t[e]=i,t},Y=M.f,H=function(t){var e=function(e,i,n){if(this instanceof t){switch(arguments.length){case 0:return new t;case 1:return new t(e);case 2:return new t(e,i)}return new t(e,i,n)}return t.apply(this,arguments)};return e.prototype=t.prototype,e},W=function(t,e){var i,n,r,s,a,h,l,d,u=t.target,c=t.global,f=t.stat,p=t.proto,v=c?o:f?o[u]:(o[u]||{}).prototype,y=c?F:F[u]||(F[u]={}),g=y.prototype;for(r in e)i=!I(c?r:u+(f?".":"#")+r,t.forced)&&v&&w(v,r),a=y[r],i&&(h=t.noTargetGet?(d=Y(v,r))&&d.value:v[r]),s=i&&h?h:e[r],i&&typeof a==typeof s||(l=t.bind&&i?j(s,o):t.wrap&&i?H(s):p&&"function"==typeof s?j(Function.call,s):s,(t.sham||s&&s.sham||a&&a.sham)&&B(l,"sham",!0),y[r]=l,p&&(w(F,n=u+"Prototype")||B(F,n,{}),F[n][r]=s,t.real&&g&&!g[r]&&B(g,r,s)));},V=[].slice,U={},G=function(t,e,i){if(!(e in U)){for(var n=[],o=0;o<e;o++)n[o]="a["+o+"]";U[e]=Function("C,a","return new C("+n.join(",")+")");}return U[e](t,i)},q=Function.bind||function(t){var e=N(this),i=V.call(arguments,1),n=function(){var o=i.concat(V.call(arguments));return this instanceof n?G(e,o.length,o):e.apply(t,o)};return g(e.prototype)&&(n.prototype=e.prototype),n};W({target:"Function",proto:!0},{bind:q});var X=function(t){return F[t+"Prototype"]},Z=X("Function").bind,K=Function.prototype,$=function(t){var e=t.bind;return t===K||t instanceof Function&&e===K.bind?Z:e};function J(t,e,i,n){t.beginPath(),t.arc(e,i,n,0,2*Math.PI,!1),t.closePath();}function Q(t,e,i,n,o,r){var s=Math.PI/180;n-2*r<0&&(r=n/2),o-2*r<0&&(r=o/2),t.beginPath(),t.moveTo(e+r,i),t.lineTo(e+n-r,i),t.arc(e+n-r,i+r,r,270*s,360*s,!1),t.lineTo(e+n,i+o-r),t.arc(e+n-r,i+o-r,r,0,90*s,!1),t.lineTo(e+r,i+o),t.arc(e+r,i+o-r,r,90*s,180*s,!1),t.lineTo(e,i+r),t.arc(e+r,i+r,r,180*s,270*s,!1),t.closePath();}function tt(t,e,i,n,o){var r=n/2*.5522848,s=o/2*.5522848,a=e+n,h=i+o,l=e+n/2,d=i+o/2;t.beginPath(),t.moveTo(e,d),t.bezierCurveTo(e,d-s,l-r,i,l,i),t.bezierCurveTo(l+r,i,a,d-s,a,d),t.bezierCurveTo(a,d+s,l+r,h,l,h),t.bezierCurveTo(l-r,h,e,d+s,e,d),t.closePath();}function et(t,e,i,n,o){var r=o*(1/3),s=n/2*.5522848,a=r/2*.5522848,h=e+n,l=i+r,d=e+n/2,u=i+r/2,c=i+(o-r/2),f=i+o;t.beginPath(),t.moveTo(h,u),t.bezierCurveTo(h,u+a,d+s,l,d,l),t.bezierCurveTo(d-s,l,e,u+a,e,u),t.bezierCurveTo(e,u-a,d-s,i,d,i),t.bezierCurveTo(d+s,i,h,u-a,h,u),t.lineTo(h,c),t.bezierCurveTo(h,c+a,d+s,f,d,f),t.bezierCurveTo(d-s,f,e,c+a,e,c),t.lineTo(e,u);}function it(t,e,i,n,o,r){t.beginPath(),t.moveTo(e,i);for(var s=r.length,a=n-e,h=o-i,l=h/a,d=Math.sqrt(a*a+h*h),u=0,c=!0,f=0,p=+r[0];d>=.1;)(p=+r[u++%s])>d&&(p=d),f=Math.sqrt(p*p/(1+l*l)),e+=f=a<0?-f:f,i+=l*f,!0===c?t.lineTo(e,i):t.moveTo(e,i),d-=p,c=!c;}var nt={circle:J,dashedLine:it,database:et,diamond:function(t,e,i,n){t.beginPath(),t.lineTo(e,i+n),t.lineTo(e+n,i),t.lineTo(e,i-n),t.lineTo(e-n,i),t.closePath();},ellipse:tt,ellipse_vis:tt,hexagon:function(t,e,i,n){t.beginPath();var o=2*Math.PI/6;t.moveTo(e+n,i);for(var r=1;r<6;r++)t.lineTo(e+n*Math.cos(o*r),i+n*Math.sin(o*r));t.closePath();},roundRect:Q,square:function(t,e,i,n){t.beginPath(),t.rect(e-n,i-n,2*n,2*n),t.closePath();},star:function(t,e,i,n){t.beginPath(),i+=.1*(n*=.82);for(var o=0;o<10;o++){var r=o%2==0?1.3*n:.5*n;t.lineTo(e+r*Math.sin(2*o*Math.PI/10),i-r*Math.cos(2*o*Math.PI/10));}t.closePath();},triangle:function(t,e,i,n){t.beginPath(),i+=.275*(n*=1.15);var o=2*n,r=o/2,s=Math.sqrt(3)/6*o,a=Math.sqrt(o*o-r*r);t.moveTo(e,i-(a-s)),t.lineTo(e+r,i+s),t.lineTo(e-r,i+s),t.lineTo(e,i-(a-s)),t.closePath();},triangleDown:function(t,e,i,n){t.beginPath(),i-=.275*(n*=1.15);var o=2*n,r=o/2,s=Math.sqrt(3)/6*o,a=Math.sqrt(o*o-r*r);t.moveTo(e,i+(a-s)),t.lineTo(e+r,i-s),t.lineTo(e-r,i-s),t.lineTo(e,i+(a-s)),t.closePath();}};var ot=i((function(t){function e(t){if(t)return function(t){for(var i in e.prototype)t[i]=e.prototype[i];return t}(t)}t.exports=e,e.prototype.on=e.prototype.addEventListener=function(t,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+t]=this._callbacks["$"+t]||[]).push(e),this},e.prototype.once=function(t,e){function i(){this.off(t,i),e.apply(this,arguments);}return i.fn=e,this.on(t,i),this},e.prototype.off=e.prototype.removeListener=e.prototype.removeAllListeners=e.prototype.removeEventListener=function(t,e){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var i,n=this._callbacks["$"+t];if(!n)return this;if(1==arguments.length)return delete this._callbacks["$"+t],this;for(var o=0;o<n.length;o++)if((i=n[o])===e||i.fn===e){n.splice(o,1);break}return 0===n.length&&delete this._callbacks["$"+t],this},e.prototype.emit=function(t){this._callbacks=this._callbacks||{};for(var e=new Array(arguments.length-1),i=this._callbacks["$"+t],n=1;n<arguments.length;n++)e[n-1]=arguments[n];if(i){n=0;for(var o=(i=i.slice(0)).length;n<o;++n)i[n].apply(this,e);}return this},e.prototype.listeners=function(t){return this._callbacks=this._callbacks||{},this._callbacks["$"+t]||[]},e.prototype.hasListeners=function(t){return !!this.listeners(t).length};})),rt="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function st(t,e){return t(e={exports:{}},e.exports),e.exports}var at=function(t){return t&&t.Math==Math&&t},ht=at("object"==typeof globalThis&&globalThis)||at("object"==typeof window&&window)||at("object"==typeof self&&self)||at("object"==typeof rt&&rt)||Function("return this")(),lt=function(t){try{return !!t()}catch(t){return !0}},dt=!lt((function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a})),ut={}.propertyIsEnumerable,ct=Object.getOwnPropertyDescriptor,ft={f:ct&&!ut.call({1:2},1)?function(t){var e=ct(this,t);return !!e&&e.enumerable}:ut},pt=function(t,e){return {enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}},vt={}.toString,yt=function(t){return vt.call(t).slice(8,-1)},gt="".split,mt=lt((function(){return !Object("z").propertyIsEnumerable(0)}))?function(t){return "String"==yt(t)?gt.call(t,""):Object(t)}:Object,bt=function(t){if(null==t)throw TypeError("Can't call method on "+t);return t},wt=function(t){return mt(bt(t))},_t=function(t){return "object"==typeof t?null!==t:"function"==typeof t},kt=function(t,e){if(!_t(t))return t;var i,n;if(e&&"function"==typeof(i=t.toString)&&!_t(n=i.call(t)))return n;if("function"==typeof(i=t.valueOf)&&!_t(n=i.call(t)))return n;if(!e&&"function"==typeof(i=t.toString)&&!_t(n=i.call(t)))return n;throw TypeError("Can't convert object to primitive value")},xt={}.hasOwnProperty,Ot=function(t,e){return xt.call(t,e)},St=ht.document,Mt=_t(St)&&_t(St.createElement),Et=function(t){return Mt?St.createElement(t):{}},Dt=!dt&&!lt((function(){return 7!=Object.defineProperty(Et("div"),"a",{get:function(){return 7}}).a})),Tt=Object.getOwnPropertyDescriptor,Ct={f:dt?Tt:function(t,e){if(t=wt(t),e=kt(e,!0),Dt)try{return Tt(t,e)}catch(t){}if(Ot(t,e))return pt(!ft.f.call(t,e),t[e])}},Pt=/#|\.prototype\./,At=function(t,e){var i=Ft[It(t)];return i==jt||i!=Nt&&("function"==typeof e?lt(e):!!e)},It=At.normalize=function(t){return String(t).replace(Pt,".").toLowerCase()},Ft=At.data={},Nt=At.NATIVE="N",jt=At.POLYFILL="P",zt=At,Lt={},Rt=function(t,e,i){if(function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function")}(t),void 0===e)return t;switch(i){case 0:return function(){return t.call(e)};case 1:return function(i){return t.call(e,i)};case 2:return function(i,n){return t.call(e,i,n)};case 3:return function(i,n,o){return t.call(e,i,n,o)}}return function(){return t.apply(e,arguments)}},Bt=function(t){if(!_t(t))throw TypeError(String(t)+" is not an object");return t},Yt=Object.defineProperty,Ht={f:dt?Yt:function(t,e,i){if(Bt(t),e=kt(e,!0),Bt(i),Dt)try{return Yt(t,e,i)}catch(t){}if("get"in i||"set"in i)throw TypeError("Accessors not supported");return "value"in i&&(t[e]=i.value),t}},Wt=dt?function(t,e,i){return Ht.f(t,e,pt(1,i))}:function(t,e,i){return t[e]=i,t},Vt=Ct.f,Ut=function(t){var e=function(e,i,n){if(this instanceof t){switch(arguments.length){case 0:return new t;case 1:return new t(e);case 2:return new t(e,i)}return new t(e,i,n)}return t.apply(this,arguments)};return e.prototype=t.prototype,e},Gt=function(t,e){var i,n,o,r,s,a,h,l,d=t.target,u=t.global,c=t.stat,f=t.proto,p=u?ht:c?ht[d]:(ht[d]||{}).prototype,v=u?Lt:Lt[d]||(Lt[d]={}),y=v.prototype;for(o in e)i=!zt(u?o:d+(c?".":"#")+o,t.forced)&&p&&Ot(p,o),s=v[o],i&&(a=t.noTargetGet?(l=Vt(p,o))&&l.value:p[o]),r=i&&a?a:e[o],i&&typeof s==typeof r||(h=t.bind&&i?Rt(r,ht):t.wrap&&i?Ut(r):f&&"function"==typeof r?Rt(Function.call,r):r,(t.sham||r&&r.sham||s&&s.sham)&&Wt(h,"sham",!0),v[o]=h,f&&(Ot(Lt,n=d+"Prototype")||Wt(Lt,n,{}),Lt[n][o]=r,t.real&&y&&!y[o]&&Wt(y,o,r)));};Gt({target:"Object",stat:!0,forced:!dt,sham:!dt},{defineProperty:Ht.f});var qt=st((function(t){var e=Lt.Object,i=t.exports=function(t,i,n){return e.defineProperty(t,i,n)};e.defineProperty.sham&&(i.sham=!0);})),Xt=qt,Zt=Math.ceil,Kt=Math.floor,$t=function(t){return isNaN(t=+t)?0:(t>0?Kt:Zt)(t)},Jt=Math.min,Qt=function(t){return t>0?Jt($t(t),9007199254740991):0},te=Math.max,ee=Math.min,ie=function(t,e){var i=$t(t);return i<0?te(i+e,0):ee(i,e)},ne=function(t){return function(e,i,n){var o,r=wt(e),s=Qt(r.length),a=ie(n,s);if(t&&i!=i){for(;s>a;)if((o=r[a++])!=o)return !0}else for(;s>a;a++)if((t||a in r)&&r[a]===i)return t||a||0;return !t&&-1}},oe={includes:ne(!0),indexOf:ne(!1)},re={},se=oe.indexOf,ae=function(t,e){var i,n=wt(t),o=0,r=[];for(i in n)!Ot(re,i)&&Ot(n,i)&&r.push(i);for(;e.length>o;)Ot(n,i=e[o++])&&(~se(r,i)||r.push(i));return r},he=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],le=Object.keys||function(t){return ae(t,he)},de=dt?Object.defineProperties:function(t,e){Bt(t);for(var i,n=le(e),o=n.length,r=0;o>r;)Ht.f(t,i=n[r++],e[i]);return t};Gt({target:"Object",stat:!0,forced:!dt,sham:!dt},{defineProperties:de});var ue=st((function(t){var e=Lt.Object,i=t.exports=function(t,i){return e.defineProperties(t,i)};e.defineProperties.sham&&(i.sham=!0);})),ce=function(t){return "function"==typeof t?t:void 0},fe=function(t,e){return arguments.length<2?ce(Lt[t])||ce(ht[t]):Lt[t]&&Lt[t][e]||ht[t]&&ht[t][e]},pe=he.concat("length","prototype"),ve={f:Object.getOwnPropertyNames||function(t){return ae(t,pe)}},ye={f:Object.getOwnPropertySymbols},ge=fe("Reflect","ownKeys")||function(t){var e=ve.f(Bt(t)),i=ye.f;return i?e.concat(i(t)):e},me=function(t,e,i){var n=kt(e);n in t?Ht.f(t,n,pt(0,i)):t[n]=i;};Gt({target:"Object",stat:!0,sham:!dt},{getOwnPropertyDescriptors:function(t){for(var e,i,n=wt(t),o=Ct.f,r=ge(n),s={},a=0;r.length>a;)void 0!==(i=o(n,e=r[a++]))&&me(s,e,i);return s}});var be=Lt.Object.getOwnPropertyDescriptors,we=Ct.f,_e=lt((function(){we(1);}));Gt({target:"Object",stat:!0,forced:!dt||_e,sham:!dt},{getOwnPropertyDescriptor:function(t,e){return we(wt(t),e)}});var ke,xe=st((function(t){var e=Lt.Object,i=t.exports=function(t,i){return e.getOwnPropertyDescriptor(t,i)};e.getOwnPropertyDescriptor.sham&&(i.sham=!0);})),Oe=!!Object.getOwnPropertySymbols&&!lt((function(){return !String(Symbol())})),Se=Oe&&!Symbol.sham&&"symbol"==typeof Symbol(),Me=Array.isArray||function(t){return "Array"==yt(t)},Ee=function(t){return Object(bt(t))},De=fe("document","documentElement"),Te=ht["__core-js_shared__"]||function(t,e){try{Wt(ht,t,e);}catch(i){ht[t]=e;}return e}("__core-js_shared__",{}),Ce=st((function(t){(t.exports=function(t,e){return Te[t]||(Te[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.6.0",mode:"pure",copyright:"© 2019 Denis Pushkarev (zloirock.ru)"});})),Pe=0,Ae=Math.random(),Ie=function(t){return "Symbol("+String(void 0===t?"":t)+")_"+(++Pe+Ae).toString(36)},Fe=Ce("keys"),Ne=function(t){return Fe[t]||(Fe[t]=Ie(t))},je=Ne("IE_PROTO"),ze=function(){},Le=function(t){return "<script>"+t+"<\/script>"},Re=function(){try{ke=document.domain&&new ActiveXObject("htmlfile");}catch(t){}var t,e;Re=ke?function(t){t.write(Le("")),t.close();var e=t.parentWindow.Object;return t=null,e}(ke):((e=Et("iframe")).style.display="none",De.appendChild(e),e.src=String("javascript:"),(t=e.contentWindow.document).open(),t.write(Le("document.F=Object")),t.close(),t.F);for(var i=he.length;i--;)delete Re.prototype[he[i]];return Re()};re[je]=!0;var Be=Object.create||function(t,e){var i;return null!==t?(ze.prototype=Bt(t),i=new ze,ze.prototype=null,i[je]=t):i=Re(),void 0===e?i:de(i,e)},Ye=ve.f,He={}.toString,We="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[],Ve={f:function(t){return We&&"[object Window]"==He.call(t)?function(t){try{return Ye(t)}catch(t){return We.slice()}}(t):Ye(wt(t))}},Ue=function(t,e,i,n){n&&n.enumerable?t[e]=i:Wt(t,e,i);},Ge=Ce("wks"),qe=ht.Symbol,Xe=Se?qe:Ie,Ze=function(t){return Ot(Ge,t)||(Oe&&Ot(qe,t)?Ge[t]=qe[t]:Ge[t]=Xe("Symbol."+t)),Ge[t]},Ke={f:Ze},$e=Ht.f,Je=function(t){var e=Lt.Symbol||(Lt.Symbol={});Ot(e,t)||$e(e,t,{value:Ke.f(t)});},Qe={};Qe[Ze("toStringTag")]="z";var ti="[object z]"===String(Qe),ei=Ze("toStringTag"),ii="Arguments"==yt(function(){return arguments}()),ni=ti?yt:function(t){var e,i,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(i=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),ei))?i:ii?yt(e):"Object"==(n=yt(e))&&"function"==typeof e.callee?"Arguments":n},oi=ti?{}.toString:function(){return "[object "+ni(this)+"]"},ri=Ht.f,si=Ze("toStringTag"),ai=function(t,e,i,n){if(t){var o=i?t:t.prototype;Ot(o,si)||ri(o,si,{configurable:!0,value:e}),n&&!ti&&Wt(o,"toString",oi);}},hi=Function.toString;"function"!=typeof Te.inspectSource&&(Te.inspectSource=function(t){return hi.call(t)});var li,di,ui,ci=Te.inspectSource,fi=ht.WeakMap,pi="function"==typeof fi&&/native code/.test(ci(fi)),vi=ht.WeakMap;if(pi){var yi=new vi,gi=yi.get,mi=yi.has,bi=yi.set;li=function(t,e){return bi.call(yi,t,e),e},di=function(t){return gi.call(yi,t)||{}},ui=function(t){return mi.call(yi,t)};}else{var wi=Ne("state");re[wi]=!0,li=function(t,e){return Wt(t,wi,e),e},di=function(t){return Ot(t,wi)?t[wi]:{}},ui=function(t){return Ot(t,wi)};}var _i={set:li,get:di,has:ui,enforce:function(t){return ui(t)?di(t):li(t,{})},getterFor:function(t){return function(e){var i;if(!_t(e)||(i=di(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return i}}},ki=Ze("species"),xi=function(t,e){var i;return Me(t)&&("function"!=typeof(i=t.constructor)||i!==Array&&!Me(i.prototype)?_t(i)&&null===(i=i[ki])&&(i=void 0):i=void 0),new(void 0===i?Array:i)(0===e?0:e)},Oi=[].push,Si=function(t){var e=1==t,i=2==t,n=3==t,o=4==t,r=6==t,s=5==t||r;return function(a,h,l,d){for(var u,c,f=Ee(a),p=mt(f),v=Rt(h,l,3),y=Qt(p.length),g=0,m=d||xi,b=e?m(a,y):i?m(a,0):void 0;y>g;g++)if((s||g in p)&&(c=v(u=p[g],g,f),t))if(e)b[g]=c;else if(c)switch(t){case 3:return !0;case 5:return u;case 6:return g;case 2:Oi.call(b,u);}else if(o)return !1;return r?-1:n||o?o:b}},Mi={forEach:Si(0),map:Si(1),filter:Si(2),some:Si(3),every:Si(4),find:Si(5),findIndex:Si(6)},Ei=Mi.forEach,Di=Ne("hidden"),Ti=Ze("toPrimitive"),Ci=_i.set,Pi=_i.getterFor("Symbol"),Ai=Object.prototype,Ii=ht.Symbol,Fi=fe("JSON","stringify"),Ni=Ct.f,ji=Ht.f,zi=Ve.f,Li=ft.f,Ri=Ce("symbols"),Bi=Ce("op-symbols"),Yi=Ce("string-to-symbol-registry"),Hi=Ce("symbol-to-string-registry"),Wi=Ce("wks"),Vi=ht.QObject,Ui=!Vi||!Vi.prototype||!Vi.prototype.findChild,Gi=dt&&lt((function(){return 7!=Be(ji({},"a",{get:function(){return ji(this,"a",{value:7}).a}})).a}))?function(t,e,i){var n=Ni(Ai,e);n&&delete Ai[e],ji(t,e,i),n&&t!==Ai&&ji(Ai,e,n);}:ji,qi=function(t,e){var i=Ri[t]=Be(Ii.prototype);return Ci(i,{type:"Symbol",tag:t,description:e}),dt||(i.description=e),i},Xi=Oe&&"symbol"==typeof Ii.iterator?function(t){return "symbol"==typeof t}:function(t){return Object(t)instanceof Ii},Zi=function(t,e,i){t===Ai&&Zi(Bi,e,i),Bt(t);var n=kt(e,!0);return Bt(i),Ot(Ri,n)?(i.enumerable?(Ot(t,Di)&&t[Di][n]&&(t[Di][n]=!1),i=Be(i,{enumerable:pt(0,!1)})):(Ot(t,Di)||ji(t,Di,pt(1,{})),t[Di][n]=!0),Gi(t,n,i)):ji(t,n,i)},Ki=function(t,e){Bt(t);var i=wt(e),n=le(i).concat(tn(i));return Ei(n,(function(e){dt&&!$i.call(i,e)||Zi(t,e,i[e]);})),t},$i=function(t){var e=kt(t,!0),i=Li.call(this,e);return !(this===Ai&&Ot(Ri,e)&&!Ot(Bi,e))&&(!(i||!Ot(this,e)||!Ot(Ri,e)||Ot(this,Di)&&this[Di][e])||i)},Ji=function(t,e){var i=wt(t),n=kt(e,!0);if(i!==Ai||!Ot(Ri,n)||Ot(Bi,n)){var o=Ni(i,n);return !o||!Ot(Ri,n)||Ot(i,Di)&&i[Di][n]||(o.enumerable=!0),o}},Qi=function(t){var e=zi(wt(t)),i=[];return Ei(e,(function(t){Ot(Ri,t)||Ot(re,t)||i.push(t);})),i},tn=function(t){var e=t===Ai,i=zi(e?Bi:wt(t)),n=[];return Ei(i,(function(t){!Ot(Ri,t)||e&&!Ot(Ai,t)||n.push(Ri[t]);})),n};if(Oe||(Ue((Ii=function(){if(this instanceof Ii)throw TypeError("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?String(arguments[0]):void 0,e=Ie(t),i=function(t){this===Ai&&i.call(Bi,t),Ot(this,Di)&&Ot(this[Di],e)&&(this[Di][e]=!1),Gi(this,e,pt(1,t));};return dt&&Ui&&Gi(Ai,e,{configurable:!0,set:i}),qi(e,t)}).prototype,"toString",(function(){return Pi(this).tag})),ft.f=$i,Ht.f=Zi,Ct.f=Ji,ve.f=Ve.f=Qi,ye.f=tn,dt&&ji(Ii.prototype,"description",{configurable:!0,get:function(){return Pi(this).description}})),Se||(Ke.f=function(t){return qi(Ze(t),t)}),Gt({global:!0,wrap:!0,forced:!Oe,sham:!Oe},{Symbol:Ii}),Ei(le(Wi),(function(t){Je(t);})),Gt({target:"Symbol",stat:!0,forced:!Oe},{for:function(t){var e=String(t);if(Ot(Yi,e))return Yi[e];var i=Ii(e);return Yi[e]=i,Hi[i]=e,i},keyFor:function(t){if(!Xi(t))throw TypeError(t+" is not a symbol");if(Ot(Hi,t))return Hi[t]},useSetter:function(){Ui=!0;},useSimple:function(){Ui=!1;}}),Gt({target:"Object",stat:!0,forced:!Oe,sham:!dt},{create:function(t,e){return void 0===e?Be(t):Ki(Be(t),e)},defineProperty:Zi,defineProperties:Ki,getOwnPropertyDescriptor:Ji}),Gt({target:"Object",stat:!0,forced:!Oe},{getOwnPropertyNames:Qi,getOwnPropertySymbols:tn}),Gt({target:"Object",stat:!0,forced:lt((function(){ye.f(1);}))},{getOwnPropertySymbols:function(t){return ye.f(Ee(t))}}),Fi){var en=!Oe||lt((function(){var t=Ii();return "[null]"!=Fi([t])||"{}"!=Fi({a:t})||"{}"!=Fi(Object(t))}));Gt({target:"JSON",stat:!0,forced:en},{stringify:function(t,e,i){for(var n,o=[t],r=1;arguments.length>r;)o.push(arguments[r++]);if(n=e,(_t(e)||void 0!==t)&&!Xi(t))return Me(e)||(e=function(t,e){if("function"==typeof n&&(e=n.call(this,t,e)),!Xi(e))return e}),o[1]=e,Fi.apply(null,o)}});}Ii.prototype[Ti]||Wt(Ii.prototype,Ti,Ii.prototype.valueOf),ai(Ii,"Symbol"),re[Di]=!0;var nn,on,rn,sn=Lt.Object.getOwnPropertySymbols,an={},hn=!lt((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype})),ln=Ne("IE_PROTO"),dn=Object.prototype,un=hn?Object.getPrototypeOf:function(t){return t=Ee(t),Ot(t,ln)?t[ln]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?dn:null},cn=(Ze("iterator"),!1);[].keys&&("next"in(rn=[].keys())?(on=un(un(rn)))!==Object.prototype&&(nn=on):cn=!0),null==nn&&(nn={});var fn={IteratorPrototype:nn,BUGGY_SAFARI_ITERATORS:cn},pn=fn.IteratorPrototype,vn=function(){return this},yn=(Object.setPrototypeOf||"__proto__"in{}&&function(){var t,e=!1,i={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(i,[]),e=i instanceof Array;}catch(t){}}(),fn.IteratorPrototype),gn=fn.BUGGY_SAFARI_ITERATORS,mn=Ze("iterator"),bn=function(){return this},wn=function(t,e,i,n,o,r,s){!function(t,e,i){var n=e+" Iterator";t.prototype=Be(pn,{next:pt(1,i)}),ai(t,n,!1,!0),an[n]=vn;}(i,e,n);var a,h,l,d=function(t){if(t===o&&v)return v;if(!gn&&t in f)return f[t];switch(t){case"keys":case"values":case"entries":return function(){return new i(this,t)}}return function(){return new i(this)}},u=e+" Iterator",c=!1,f=t.prototype,p=f[mn]||f["@@iterator"]||o&&f[o],v=!gn&&p||d(o),y="Array"==e&&f.entries||p;if(y&&(a=un(y.call(new t)),yn!==Object.prototype&&a.next&&(ai(a,u,!0,!0),an[u]=bn)),"values"==o&&p&&"values"!==p.name&&(c=!0,v=function(){return p.call(this)}),s&&f[mn]!==v&&Wt(f,mn,v),an[e]=v,o)if(h={values:d("values"),keys:r?v:d("keys"),entries:d("entries")},s)for(l in h)!gn&&!c&&l in f||Ue(f,l,h[l]);else Gt({target:e,proto:!0,forced:gn||c},h);return h},_n=_i.set,kn=_i.getterFor("Array Iterator");wn(Array,"Array",(function(t,e){_n(this,{type:"Array Iterator",target:wt(t),index:0,kind:e});}),(function(){var t=kn(this),e=t.target,i=t.kind,n=t.index++;return !e||n>=e.length?(t.target=void 0,{value:void 0,done:!0}):"keys"==i?{value:n,done:!1}:"values"==i?{value:e[n],done:!1}:{value:[n,e[n]],done:!1}}),"values");an.Arguments=an.Array;var xn=Ze("toStringTag");for(var On in {CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}){var Sn=ht[On],Mn=Sn&&Sn.prototype;Mn&&!Mn[xn]&&Wt(Mn,xn,On),an[On]=an.Array;}var En=function(t){return function(e,i){var n,o,r=String(bt(e)),s=$t(i),a=r.length;return s<0||s>=a?t?"":void 0:(n=r.charCodeAt(s))<55296||n>56319||s+1===a||(o=r.charCodeAt(s+1))<56320||o>57343?t?r.charAt(s):n:t?r.slice(s,s+2):o-56320+(n-55296<<10)+65536}},Dn={codeAt:En(!1),charAt:En(!0)}.charAt,Tn=_i.set,Cn=_i.getterFor("String Iterator");wn(String,"String",(function(t){Tn(this,{type:"String Iterator",string:String(t),index:0});}),(function(){var t,e=Cn(this),i=e.string,n=e.index;return n>=i.length?{value:void 0,done:!0}:(t=Dn(i,n),e.index+=t.length,{value:t,done:!1})}));var Pn=Ze("iterator"),An=function(t){if(null!=t)return t[Pn]||t["@@iterator"]||an[ni(t)]},In=function(t){var e=An(t);if("function"!=typeof e)throw TypeError(String(t)+" is not iterable");return Bt(e.call(t))};Gt({target:"Object",stat:!0,sham:!dt},{create:Be});var Fn=Lt.Object,Nn=function(t,e){return Fn.create(t,e)},jn=qt;var zn=function(t,e,i){return e in t?jn(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t},Ln=lt((function(){le(1);}));Gt({target:"Object",stat:!0,forced:Ln},{keys:function(t){return le(Ee(t))}});var Rn,Bn=Lt.Object.keys,Yn="\t\n\v\f\r                　\u2028\u2029\ufeff",Hn="["+Yn+"]",Wn=RegExp("^"+Hn+Hn+"*"),Vn=RegExp(Hn+Hn+"*$"),Un=function(t){return function(e){var i=String(bt(e));return 1&t&&(i=i.replace(Wn,"")),2&t&&(i=i.replace(Vn,"")),i}},Gn={start:Un(1),end:Un(2),trim:Un(3)},qn=Gn.trim;Gt({target:"String",proto:!0,forced:(Rn="trim",lt((function(){return !!Yn[Rn]()||"​᠎"!="​᠎"[Rn]()||Yn[Rn].name!==Rn})))},{trim:function(){return qn(this)}});var Xn=function(t){return Lt[t+"Prototype"]},Zn=Xn("String").trim,Kn=String.prototype,$n=function(t){var e=t.trim;return "string"==typeof t||t===Kn||t instanceof String&&e===Kn.trim?Zn:e},Jn=function(t,e){var i=[][t];return !i||!lt((function(){i.call(null,e||function(){throw 1},1);}))},Qn=Mi.forEach,to=Jn("forEach")?function(t){return Qn(this,t,arguments.length>1?arguments[1]:void 0)}:[].forEach;Gt({target:"Array",proto:!0,forced:[].forEach!=to},{forEach:to});var eo,io,no=Xn("Array").forEach,oo=Array.prototype,ro={DOMTokenList:!0,NodeList:!0},so=function(t){var e=t.forEach;return t===oo||t instanceof Array&&e===oo.forEach||ro.hasOwnProperty(ni(t))?no:e},ao=fe("navigator","userAgent")||"",ho=ht.process,lo=ho&&ho.versions,uo=lo&&lo.v8;uo?io=(eo=uo.split("."))[0]+eo[1]:ao&&(!(eo=ao.match(/Edge\/(\d+)/))||eo[1]>=74)&&(eo=ao.match(/Chrome\/(\d+)/))&&(io=eo[1]);var co=io&&+io,fo=Ze("species"),po=function(t){return co>=51||!lt((function(){var e=[];return (e.constructor={})[fo]=function(){return {foo:1}},1!==e[t](Boolean).foo}))},vo=Mi.map,yo=po("map"),go=yo&&!lt((function(){[].map.call({length:-1,0:1},(function(t){throw t}));}));Gt({target:"Array",proto:!0,forced:!yo||!go},{map:function(t){return vo(this,t,arguments.length>1?arguments[1]:void 0)}});var mo=Xn("Array").map,bo=Array.prototype,wo=function(t){var e=t.map;return t===bo||t instanceof Array&&e===bo.map?mo:e},_o=Gn.trim,ko=ht.parseInt,xo=/^[+-]?0[Xx]/,Oo=8!==ko(Yn+"08")||22!==ko(Yn+"0x16")?function(t,e){var i=_o(String(t));return ko(i,e>>>0||(xo.test(i)?16:10))}:ko;Gt({global:!0,forced:parseInt!=Oo},{parseInt:Oo});var So=Lt.parseInt,Mo=ft.f,Eo=function(t){return function(e){for(var i,n=wt(e),o=le(n),r=o.length,s=0,a=[];r>s;)i=o[s++],dt&&!Mo.call(n,i)||a.push(t?[i,n[i]]:n[i]);return a}},Do={entries:Eo(!0),values:Eo(!1)}.values;Gt({target:"Object",stat:!0},{values:function(t){return Do(t)}});var To=Lt.Object.values,Co=Mi.filter,Po=po("filter"),Ao=Po&&!lt((function(){[].filter.call({length:-1,0:1},(function(t){throw t}));}));Gt({target:"Array",proto:!0,forced:!Po||!Ao},{filter:function(t){return Co(this,t,arguments.length>1?arguments[1]:void 0)}});var Io=Xn("Array").filter,Fo=Array.prototype,No=function(t){var e=t.filter;return t===Fo||t instanceof Array&&e===Fo.filter?Io:e},jo=Ze("isConcatSpreadable"),zo=co>=51||!lt((function(){var t=[];return t[jo]=!1,t.concat()[0]!==t})),Lo=po("concat"),Ro=function(t){if(!_t(t))return !1;var e=t[jo];return void 0!==e?!!e:Me(t)};Gt({target:"Array",proto:!0,forced:!zo||!Lo},{concat:function(t){var e,i,n,o,r,s=Ee(this),a=xi(s,0),h=0;for(e=-1,n=arguments.length;e<n;e++)if(r=-1===e?s:arguments[e],Ro(r)){if(h+(o=Qt(r.length))>9007199254740991)throw TypeError("Maximum allowed index exceeded");for(i=0;i<o;i++,h++)i in r&&me(a,h,r[i]);}else{if(h>=9007199254740991)throw TypeError("Maximum allowed index exceeded");me(a,h++,r);}return a.length=h,a}});var Bo=Xn("Array").concat,Yo=Array.prototype,Ho=function(t){var e=t.concat;return t===Yo||t instanceof Array&&e===Yo.concat?Bo:e};Gt({target:"Array",stat:!0},{isArray:Me});var Wo=Lt.Array.isArray,Vo=Wo;var Uo=function(t){if(Vo(t)){for(var e=0,i=new Array(t.length);e<t.length;e++)i[e]=t[e];return i}},Go=function(t,e,i,n){try{return n?e(Bt(i)[0],i[1]):e(i)}catch(e){var o=t.return;throw void 0!==o&&Bt(o.call(t)),e}},qo=Ze("iterator"),Xo=Array.prototype,Zo=function(t){return void 0!==t&&(an.Array===t||Xo[qo]===t)},Ko=Ze("iterator"),$o=!1;try{var Jo=0,Qo={next:function(){return {done:!!Jo++}},return:function(){$o=!0;}};Qo[Ko]=function(){return this},Array.from(Qo,(function(){throw 2}));}catch(t){}var tr=!function(t,e){if(!e&&!$o)return !1;var i=!1;try{var n={};n[Ko]=function(){return {next:function(){return {done:i=!0}}}},t(n);}catch(t){}return i}((function(t){Array.from(t);}));Gt({target:"Array",stat:!0,forced:tr},{from:function(t){var e,i,n,o,r,s=Ee(t),a="function"==typeof this?this:Array,h=arguments.length,l=h>1?arguments[1]:void 0,d=void 0!==l,u=0,c=An(s);if(d&&(l=Rt(l,h>2?arguments[2]:void 0,2)),null==c||a==Array&&Zo(c))for(i=new a(e=Qt(s.length));e>u;u++)me(i,u,d?l(s[u],u):s[u]);else for(r=(o=c.call(s)).next,i=new a;!(n=r.call(o)).done;u++)me(i,u,d?Go(o,l,[n.value,u],!0):n.value);return i.length=u,i}});var er=Lt.Array.from,ir=Ze("iterator"),nr=function(t){var e=Object(t);return void 0!==e[ir]||"@@iterator"in e||an.hasOwnProperty(ni(e))};var or=function(t){if(nr(Object(t))||"[object Arguments]"===Object.prototype.toString.call(t))return er(t)};var rr=function(){throw new TypeError("Invalid attempt to spread non-iterable instance")};var sr=function(t){return Uo(t)||or(t)||rr()},ar=Ze("species"),hr=[].slice,lr=Math.max;Gt({target:"Array",proto:!0,forced:!po("slice")},{slice:function(t,e){var i,n,o,r=wt(this),s=Qt(r.length),a=ie(t,s),h=ie(void 0===e?s:e,s);if(Me(r)&&("function"!=typeof(i=r.constructor)||i!==Array&&!Me(i.prototype)?_t(i)&&null===(i=i[ar])&&(i=void 0):i=void 0,i===Array||void 0===i))return hr.call(r,a,h);for(n=new(void 0===i?Array:i)(lr(h-a,0)),o=0;a<h;a++,o++)a in r&&me(n,o,r[a]);return n.length=o,n}});var dr=Xn("Array").slice,ur=Array.prototype,cr=function(t){var e=t.slice;return t===ur||t instanceof Array&&e===ur.slice?dr:e},fr=lt((function(){un(1);}));Gt({target:"Object",stat:!0,forced:fr,sham:!hn},{getPrototypeOf:function(t){return un(Ee(t))}});var pr=Lt.Object.getPrototypeOf,vr=oe.indexOf,yr=[].indexOf,gr=!!yr&&1/[1].indexOf(1,-0)<0,mr=Jn("indexOf");Gt({target:"Array",proto:!0,forced:gr||mr},{indexOf:function(t){return gr?yr.apply(this,arguments)||0:vr(this,t,arguments.length>1?arguments[1]:void 0)}});var br=Xn("Array").indexOf,wr=Array.prototype,_r=function(t){var e=t.indexOf;return t===wr||t instanceof Array&&e===wr.indexOf?br:e},kr=Wo,xr=Object.assign,Or=Object.defineProperty,Sr=!xr||lt((function(){if(dt&&1!==xr({b:1},xr(Or({},"a",{enumerable:!0,get:function(){Or(this,"b",{value:3,enumerable:!1});}}),{b:2})).b)return !0;var t={},e={},i=Symbol();return t[i]=7,"abcdefghijklmnopqrst".split("").forEach((function(t){e[t]=t;})),7!=xr({},t)[i]||"abcdefghijklmnopqrst"!=le(xr({},e)).join("")}))?function(t,e){for(var i=Ee(t),n=arguments.length,o=1,r=ye.f,s=ft.f;n>o;)for(var a,h=mt(arguments[o++]),l=r?le(h).concat(r(h)):le(h),d=l.length,u=0;d>u;)a=l[u++],dt&&!s.call(h,a)||(i[a]=h[a]);return i}:xr;Gt({target:"Object",stat:!0,forced:Object.assign!==Sr},{assign:Sr});var Mr=Lt.Object.assign;Je("iterator");var Er=Ke.f("iterator");Je("asyncIterator"),Je("hasInstance"),Je("isConcatSpreadable"),Je("match"),Je("matchAll"),Je("replace"),Je("search"),Je("species"),Je("split"),Je("toPrimitive"),Je("toStringTag"),Je("unscopables"),ai(Math,"Math",!0),ai(ht.JSON,"JSON",!0);var Dr=Lt.Symbol;Je("asyncDispose"),Je("dispose"),Je("observable"),Je("patternMatch"),Je("replaceAll");for(var Tr=Dr,Cr=st((function(t){function e(i){return t.exports=e="function"==typeof Tr&&"symbol"==typeof Er?function(t){return typeof t}:function(t){return t&&"function"==typeof Tr&&t.constructor===Tr&&t!==Tr.prototype?"symbol":typeof t},e(i)}t.exports=e;})),Pr=[],Ar=0;Ar<256;Ar++)Pr[Ar]=(Ar+256).toString(16).substr(1);for(var Ir=function(){if("undefined"!=typeof crypto&&crypto.getRandomValues){var t=new Uint8Array(16);return function(){return crypto.getRandomValues(t),t}}var e=new Array(16);return function(){for(var t,i=0;i<16;i++)0==(3&i)&&(t=4294967296*Math.random()),e[i]=t>>>((3&i)<<3)&255;return e}}(),Fr=[],Nr=0;Nr<256;Nr++)Fr[Nr]=(Nr+256).toString(16).substr(1);var jr=Ir();jr[0],jr[1],jr[2],jr[3],jr[4],jr[5],jr[6],jr[7];function zr(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=arguments.length>1?arguments[1]:void 0,i=arguments.length>2?arguments[2]:void 0,n=e&&i||0;"string"==typeof t&&(e="binary"===t?new Array(16):void 0,t={});var o=t.random||(t.rng||Ir)();if(o[6]=15&o[6]|64,o[8]=63&o[8]|128,e)for(var r=0;r<16;r++)e[n+r]=o[r];return e||function(t,e){var i=e||0,n=Pr;return n[t[i++]]+n[t[i++]]+n[t[i++]]+n[t[i++]]+"-"+n[t[i++]]+n[t[i++]]+"-"+n[t[i++]]+n[t[i++]]+"-"+n[t[i++]]+n[t[i++]]+"-"+n[t[i++]]+n[t[i++]]+n[t[i++]]+n[t[i++]]+n[t[i++]]+n[t[i++]]}(o)}function Lr(t,e){var i=Bn(t);if(sn){var n=sn(t);e&&(n=No(n).call(n,(function(e){return xe(t,e).enumerable}))),i.push.apply(i,n);}return i}var Rr=/^\/?Date\((-?\d+)/i,Br=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,Yr=/^#?([a-f\d])([a-f\d])([a-f\d])$/i,Hr=/^rgb\( *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *(1?\d{1,2}|2[0-4]\d|25[0-5]) *\)$/i,Wr=/^rgba\( *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *([01]|0?\.\d+) *\)$/i;function Vr(t){return t instanceof Number||"number"==typeof t}function Ur(t){if(t)for(;!0===t.hasChildNodes();){var e=t.firstChild;e&&(Ur(e),t.removeChild(e));}}function Gr(t){return t instanceof String||"string"==typeof t}function qr(t){return "object"===Cr(t)&&null!==t}function Xr(t){if(t instanceof Date)return !0;if(Gr(t)){if(Rr.exec(t))return !0;if(!isNaN(Date.parse(t)))return !0}return !1}function Zr(t,e,i,n){var o=!1;!0===n&&(o=null===e[i]&&void 0!==t[i]),o?delete t[i]:t[i]=e[i];}function Kr(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2];for(var n in t)if(void 0!==e[n])if(null===e[n]||"object"!==Cr(e[n]))Zr(t,e,n,i);else{var o=t[n],r=e[n];qr(o)&&qr(r)&&Kr(o,r,i);}}var $r=Mr;function Jr(t,e){if(!kr(t))throw new Error("Array with property names expected as first argument");for(var i=arguments.length,n=new Array(i>2?i-2:0),o=2;o<i;o++)n[o-2]=arguments[o];for(var r=0,s=n;r<s.length;r++)for(var a=s[r],h=0;h<t.length;h++){var l=t[h];a&&Object.prototype.hasOwnProperty.call(a,l)&&(e[l]=a[l]);}return e}function Qr(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]&&arguments[3];if(kr(i))throw new TypeError("Arrays are not supported by deepExtend");for(var o=0;o<t.length;o++){var r=t[o];if(Object.prototype.hasOwnProperty.call(i,r))if(i[r]&&i[r].constructor===Object)void 0===e[r]&&(e[r]={}),e[r].constructor===Object?es(e[r],i[r],!1,n):Zr(e,i,r,n);else{if(kr(i[r]))throw new TypeError("Arrays are not supported by deepExtend");Zr(e,i,r,n);}}return e}function ts(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]&&arguments[3];if(kr(i))throw new TypeError("Arrays are not supported by deepExtend");for(var o in i)if(Object.prototype.hasOwnProperty.call(i,o)&&-1===_r(t).call(t,o))if(i[o]&&i[o].constructor===Object)void 0===e[o]&&(e[o]={}),e[o].constructor===Object?es(e[o],i[o]):Zr(e,i,o,n);else if(kr(i[o])){e[o]=[];for(var r=0;r<i[o].length;r++)e[o].push(i[o][r]);}else Zr(e,i,o,n);return e}function es(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=arguments.length>3&&void 0!==arguments[3]&&arguments[3];for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)||!0===i)if("object"===Cr(e[o])&&null!==e[o]&&pr(e[o])===Object.prototype)void 0===t[o]?t[o]=es({},e[o],i):"object"===Cr(t[o])&&null!==t[o]&&pr(t[o])===Object.prototype?es(t[o],e[o],i):Zr(t,e,o,n);else if(kr(e[o])){var r;t[o]=cr(r=e[o]).call(r);}else Zr(t,e,o,n);return t}function is(t,e){if(t.length!==e.length)return !1;for(var i=0,n=t.length;i<n;i++)if(t[i]!=e[i])return !1;return !0}function ns(t){var e=Cr(t);return "object"===e?null===t?"null":t instanceof Boolean?"Boolean":t instanceof Number?"Number":t instanceof String?"String":kr(t)?"Array":t instanceof Date?"Date":"Object":"number"===e?"Number":"boolean"===e?"Boolean":"string"===e?"String":void 0===e?"undefined":e}function os(t,e){var i;return Ho(i=[]).call(i,sr(t),[e])}function rs(t){return cr(t).call(t)}function ss(t){return t.getBoundingClientRect().left}function as(t){return t.getBoundingClientRect().right}function hs(t){return t.getBoundingClientRect().top}function ls(t,e){var i=t.className.split(" "),n=e.split(" ");i=Ho(i).call(i,No(n).call(n,(function(t){return _r(i).call(i,t)<0}))),t.className=i.join(" ");}function ds(t,e){var i=t.className.split(" "),n=e.split(" ");i=No(i).call(i,(function(t){return _r(n).call(n,t)<0})),t.className=i.join(" ");}function us(t,e){if(kr(t))for(var i=t.length,n=0;n<i;n++)e(t[n],n,t);else for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&e(t[o],o,t);}var cs=To;function fs(t,e,i){return t[e]!==i&&(t[e]=i,!0)}function ps(t){var e=!1;return function(){e||(e=!0,requestAnimationFrame((function(){e=!1,t();})));}}function vs(t,e,i,n){var o;t.addEventListener?(void 0===n&&(n=!1),"mousewheel"===e&&_r(o=navigator.userAgent).call(o,"Firefox")>=0&&(e="DOMMouseScroll"),t.addEventListener(e,i,n)):t.attachEvent("on"+e,i);}function ys(t,e,i,n){var o;t.removeEventListener?(void 0===n&&(n=!1),"mousewheel"===e&&_r(o=navigator.userAgent).call(o,"Firefox")>=0&&(e="DOMMouseScroll"),t.removeEventListener(e,i,n)):t.detachEvent("on"+e,i);}function gs(t){t||(t=window.event),t&&(t.preventDefault?t.preventDefault():t.returnValue=!1);}function ms(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window.event,e=null;return t&&(t.target?e=t.target:t.srcElement&&(e=t.srcElement)),e instanceof Element&&(null==e.nodeType||3!=e.nodeType||(e=e.parentNode)instanceof Element)?e:null}function bs(t,e){for(var i=t;i;){if(i===e)return !0;if(!i.parentNode)return !1;i=i.parentNode;}return !1}var ws={asBoolean:function(t,e){return "function"==typeof t&&(t=t()),null!=t?0!=t:e||null},asNumber:function(t,e){return "function"==typeof t&&(t=t()),null!=t?Number(t)||e||null:e||null},asString:function(t,e){return "function"==typeof t&&(t=t()),null!=t?String(t):e||null},asSize:function(t,e){return "function"==typeof t&&(t=t()),Gr(t)?t:Vr(t)?t+"px":e||null},asElement:function(t,e){return "function"==typeof t&&(t=t()),t||e||null}};function _s(t){var e;switch(t.length){case 3:case 4:return (e=Yr.exec(t))?{r:So(e[1]+e[1],16),g:So(e[2]+e[2],16),b:So(e[3]+e[3],16)}:null;case 6:case 7:return (e=Br.exec(t))?{r:So(e[1],16),g:So(e[2],16),b:So(e[3],16)}:null;default:return null}}function ks(t,e){if(-1!==_r(t).call(t,"rgba"))return t;if(-1!==_r(t).call(t,"rgb")){var i=t.substr(_r(t).call(t,"(")+1).replace(")","").split(",");return "rgba("+i[0]+","+i[1]+","+i[2]+","+e+")"}var n=_s(t);return null==n?t:"rgba("+n.r+","+n.g+","+n.b+","+e+")"}function xs(t,e,i){var n;return "#"+cr(n=((1<<24)+(t<<16)+(e<<8)+i).toString(16)).call(n,1)}function Os(t,e){if(Gr(t)){var i=t;if(Is(i)){var n,o=wo(n=i.substr(4).substr(0,i.length-5).split(",")).call(n,(function(t){return So(t)}));i=xs(o[0],o[1],o[2]);}if(!0===As(i)){var r=Ps(i),s={h:r.h,s:.8*r.s,v:Math.min(1,1.02*r.v)},a={h:r.h,s:Math.min(1,1.25*r.s),v:.8*r.v},h=Cs(a.h,a.s,a.v),l=Cs(s.h,s.s,s.v);return {background:i,border:h,highlight:{background:l,border:h},hover:{background:l,border:h}}}return {background:i,border:i,highlight:{background:i,border:i},hover:{background:i,border:i}}}return e?{background:t.background||e.background,border:t.border||e.border,highlight:Gr(t.highlight)?{border:t.highlight,background:t.highlight}:{background:t.highlight&&t.highlight.background||e.highlight.background,border:t.highlight&&t.highlight.border||e.highlight.border},hover:Gr(t.hover)?{border:t.hover,background:t.hover}:{border:t.hover&&t.hover.border||e.hover.border,background:t.hover&&t.hover.background||e.hover.background}}:{background:t.background||void 0,border:t.border||void 0,highlight:Gr(t.highlight)?{border:t.highlight,background:t.highlight}:{background:t.highlight&&t.highlight.background||void 0,border:t.highlight&&t.highlight.border||void 0},hover:Gr(t.hover)?{border:t.hover,background:t.hover}:{border:t.hover&&t.hover.border||void 0,background:t.hover&&t.hover.background||void 0}}}function Ss(t,e,i){t/=255,e/=255,i/=255;var n=Math.min(t,Math.min(e,i)),o=Math.max(t,Math.max(e,i));return n===o?{h:0,s:0,v:n}:{h:60*((t===n?3:i===n?1:5)-(t===n?e-i:i===n?t-e:i-t)/(o-n))/360,s:(o-n)/o,v:o}}var Ms={split:function(t){var e,i={};return so(e=t.split(";")).call(e,(function(t){if(""!=$n(t).call(t)){var e,n,o=t.split(":"),r=$n(e=o[0]).call(e),s=$n(n=o[1]).call(n);i[r]=s;}})),i},join:function(t){var e;return wo(e=Bn(t)).call(e,(function(e){return e+": "+t[e]})).join("; ")}};function Es(t,e){var i=function(t){for(var e=1;e<arguments.length;e++){var i,n=null!=arguments[e]?arguments[e]:{};if(e%2)so(i=Lr(Object(n),!0)).call(i,(function(e){zn(t,e,n[e]);}));else if(be)ue(t,be(n));else{var o;so(o=Lr(Object(n))).call(o,(function(e){Xt(t,e,xe(n,e));}));}}return t}({},Ms.split(t.style.cssText),{},Ms.split(e));t.style.cssText=Ms.join(i);}function Ds(t,e){var i=Ms.split(t.style.cssText),n=Ms.split(e);for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&delete i[o];t.style.cssText=Ms.join(i);}function Ts(t,e,i){var n,o,r,s=Math.floor(6*t),a=6*t-s,h=i*(1-e),l=i*(1-a*e),d=i*(1-(1-a)*e);switch(s%6){case 0:n=i,o=d,r=h;break;case 1:n=l,o=i,r=h;break;case 2:n=h,o=i,r=d;break;case 3:n=h,o=l,r=i;break;case 4:n=d,o=h,r=i;break;case 5:n=i,o=h,r=l;}return {r:Math.floor(255*n),g:Math.floor(255*o),b:Math.floor(255*r)}}function Cs(t,e,i){var n=Ts(t,e,i);return xs(n.r,n.g,n.b)}function Ps(t){var e=_s(t);if(!e)throw new TypeError("'".concat(t,"' is not a valid color."));return Ss(e.r,e.g,e.b)}function As(t){return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(t)}function Is(t){return Hr.test(t)}function Fs(t){return Wr.test(t)}function Ns(t,e){if(null!==e&&"object"===Cr(e)){for(var i=Nn(e),n=0;n<t.length;n++)Object.prototype.hasOwnProperty.call(e,t[n])&&"object"==Cr(e[t[n]])&&(i[t[n]]=js(e[t[n]]));return i}return null}function js(t){if(null===t||"object"!==Cr(t))return null;if(t instanceof Element)return t;var e=Nn(t);for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&"object"==Cr(t[i])&&(e[i]=js(t[i]));return e}function zs(t,e){for(var i=0;i<t.length;i++){var n=t[i],o=void 0;for(o=i;o>0&&e(n,t[o-1])<0;o--)t[o]=t[o-1];t[o]=n;}return t}function Ls(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{},o=function(t){return null!=t},r=function(t){return null!==t&&"object"===Cr(t)};if(!r(t))throw new Error("Parameter mergeTarget must be an object");if(!r(e))throw new Error("Parameter options must be an object");if(!o(i))throw new Error("Parameter option must have a value");if(!r(n))throw new Error("Parameter globalOptions must be an object");var s=e[i],a=r(n)&&!function(t){for(var e in t)if(Object.prototype.hasOwnProperty.call(t,e))return !1;return !0}(n)?n[i]:void 0,h=a?a.enabled:void 0;if(void 0!==s){if("boolean"==typeof s)return r(t[i])||(t[i]={}),void(t[i].enabled=s);if(null===s&&!r(t[i])){if(!o(a))return;t[i]=Nn(a);}if(r(s)){var l=!0;void 0!==s.enabled?l=s.enabled:void 0!==h&&(l=a.enabled),function(t,e,i){r(t[i])||(t[i]={});var n=e[i],o=t[i];for(var s in n)Object.prototype.hasOwnProperty.call(n,s)&&(o[s]=n[s]);}(t,e,i),t[i].enabled=l;}}}function Rs(t,e,i,n){for(var o=0,r=0,s=t.length-1;r<=s&&o<1e4;){var a=Math.floor((r+s)/2),h=t[a],l=e(void 0===n?h[i]:h[i][n]);if(0==l)return a;-1==l?r=a+1:s=a-1,o++;}return -1}function Bs(t,e,i,n,o){var r,s,a,h,l=0,d=0,u=t.length-1;for(o=null!=o?o:function(t,e){return t==e?0:t<e?-1:1};d<=u&&l<1e4;){if(h=Math.floor(.5*(u+d)),r=t[Math.max(0,h-1)][i],s=t[h][i],a=t[Math.min(t.length-1,h+1)][i],0==o(s,e))return h;if(o(r,e)<0&&o(s,e)>0)return "before"==n?Math.max(0,h-1):h;if(o(s,e)<0&&o(a,e)>0)return "before"==n?h:Math.min(t.length-1,h+1);o(s,e)<0?d=h+1:u=h-1,l++;}return -1}var Ys={linear:function(t){return t},easeInQuad:function(t){return t*t},easeOutQuad:function(t){return t*(2-t)},easeInOutQuad:function(t){return t<.5?2*t*t:(4-2*t)*t-1},easeInCubic:function(t){return t*t*t},easeOutCubic:function(t){return --t*t*t+1},easeInOutCubic:function(t){return t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1},easeInQuart:function(t){return t*t*t*t},easeOutQuart:function(t){return 1- --t*t*t*t},easeInOutQuart:function(t){return t<.5?8*t*t*t*t:1-8*--t*t*t*t},easeInQuint:function(t){return t*t*t*t*t},easeOutQuint:function(t){return 1+--t*t*t*t*t},easeInOutQuint:function(t){return t<.5?16*t*t*t*t*t:1+16*--t*t*t*t*t}};function Hs(){var t=document.createElement("p");t.style.width="100%",t.style.height="200px";var e=document.createElement("div");e.style.position="absolute",e.style.top="0px",e.style.left="0px",e.style.visibility="hidden",e.style.width="200px",e.style.height="150px",e.style.overflow="hidden",e.appendChild(t),document.body.appendChild(e);var i=t.offsetWidth;e.style.overflow="scroll";var n=t.offsetWidth;return i==n&&(n=e.clientWidth),document.body.removeChild(e),i-n}function Ws(t,e){var i;kr(e)||(e=[e]);var n=!0,o=!1,r=void 0;try{for(var s,a=In(t);!(n=(s=a.next()).done);n=!0){var h=s.value;if(h){i=h[e[0]];for(var l=1;l<e.length;l++)i&&(i=i[e[l]]);if(void 0!==i)break}}}catch(t){o=!0,r=t;}finally{try{n||null==a.return||a.return();}finally{if(o)throw r}}return i}var Vs=Object.freeze({__proto__:null,isNumber:Vr,recursiveDOMDelete:Ur,isString:Gr,isObject:qr,isDate:Xr,fillIfDefined:Kr,extend:$r,selectiveExtend:Jr,selectiveDeepExtend:Qr,selectiveNotDeepExtend:ts,deepExtend:es,equalArray:is,getType:ns,copyAndExtendArray:os,copyArray:rs,getAbsoluteLeft:ss,getAbsoluteRight:as,getAbsoluteTop:hs,addClassName:ls,removeClassName:ds,forEach:us,toArray:cs,updateProperty:fs,throttle:ps,addEventListener:vs,removeEventListener:ys,preventDefault:gs,getTarget:ms,hasParent:bs,option:ws,hexToRGB:_s,overrideOpacity:ks,RGBToHex:xs,parseColor:Os,RGBToHSV:Ss,addCssText:Es,removeCssText:Ds,HSVToRGB:Ts,HSVToHex:Cs,hexToHSV:Ps,isValidHex:As,isValidRGB:Is,isValidRGBA:Fs,selectiveBridgeObject:Ns,bridgeObject:js,insertSort:zs,mergeOptions:Ls,binarySearchCustom:Rs,binarySearchValue:Bs,easingFunctions:Ys,getScrollBarWidth:Hs,topMost:Ws,randomUUID:zr}),Us=Object.freeze({__proto__:null,default:Vs,HSVToHex:Cs,HSVToRGB:Ts,RGBToHSV:Ss,RGBToHex:xs,addClassName:ls,addCssText:Es,addEventListener:vs,binarySearchCustom:Rs,binarySearchValue:Bs,bridgeObject:js,copyAndExtendArray:os,copyArray:rs,deepExtend:es,easingFunctions:Ys,equalArray:is,extend:$r,fillIfDefined:Kr,forEach:us,getAbsoluteLeft:ss,getAbsoluteRight:as,getAbsoluteTop:hs,getScrollBarWidth:Hs,getTarget:ms,getType:ns,hasParent:bs,hexToHSV:Ps,hexToRGB:_s,insertSort:zs,isDate:Xr,isNumber:Vr,isObject:qr,isString:Gr,isValidHex:As,isValidRGB:Is,isValidRGBA:Fs,mergeOptions:Ls,option:ws,overrideOpacity:ks,parseColor:Os,preventDefault:gs,randomUUID:zr,recursiveDOMDelete:Ur,removeClassName:ds,removeCssText:Ds,removeEventListener:ys,selectiveBridgeObject:Ns,selectiveDeepExtend:Qr,selectiveExtend:Jr,selectiveNotDeepExtend:ts,throttle:ps,toArray:cs,topMost:Ws,updateProperty:fs}),Gs={},qs=o["__core-js_shared__"]||function(t,e){try{B(o,t,e);}catch(i){o[t]=e;}return e}("__core-js_shared__",{}),Xs=Function.toString;"function"!=typeof qs.inspectSource&&(qs.inspectSource=function(t){return Xs.call(t)});var Zs,Ks,$s,Js=qs.inspectSource,Qs=o.WeakMap,ta="function"==typeof Qs&&/native code/.test(Js(Qs)),ea=i((function(t){(t.exports=function(t,e){return qs[t]||(qs[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.6.0",mode:"pure",copyright:"© 2019 Denis Pushkarev (zloirock.ru)"});})),ia=0,na=Math.random(),oa=function(t){return "Symbol("+String(void 0===t?"":t)+")_"+(++ia+na).toString(36)},ra=ea("keys"),sa=function(t){return ra[t]||(ra[t]=oa(t))},aa={},ha=o.WeakMap;if(ta){var la=new ha,da=la.get,ua=la.has,ca=la.set;Zs=function(t,e){return ca.call(la,t,e),e},Ks=function(t){return da.call(la,t)||{}},$s=function(t){return ua.call(la,t)};}else{var fa=sa("state");aa[fa]=!0,Zs=function(t,e){return B(t,fa,e),e},Ks=function(t){return w(t,fa)?t[fa]:{}},$s=function(t){return w(t,fa)};}var pa,va,ya,ga={set:Zs,get:Ks,has:$s,enforce:function(t){return $s(t)?Ks(t):Zs(t,{})},getterFor:function(t){return function(e){var i;if(!g(e)||(i=Ks(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return i}}},ma=function(t){return Object(v(t))},ba=!r((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype})),wa=sa("IE_PROTO"),_a=Object.prototype,ka=ba?Object.getPrototypeOf:function(t){return t=ma(t),w(t,wa)?t[wa]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?_a:null},xa=!!Object.getOwnPropertySymbols&&!r((function(){return !String(Symbol())})),Oa=xa&&!Symbol.sham&&"symbol"==typeof Symbol(),Sa=ea("wks"),Ma=o.Symbol,Ea=Oa?Ma:oa,Da=function(t){return w(Sa,t)||(xa&&w(Ma,t)?Sa[t]=Ma[t]:Sa[t]=Ea("Symbol."+t)),Sa[t]},Ta=(Da("iterator"),!1);[].keys&&("next"in(ya=[].keys())?(va=ka(ka(ya)))!==Object.prototype&&(pa=va):Ta=!0),null==pa&&(pa={});var Ca,Pa={IteratorPrototype:pa,BUGGY_SAFARI_ITERATORS:Ta},Aa=Math.ceil,Ia=Math.floor,Fa=function(t){return isNaN(t=+t)?0:(t>0?Ia:Aa)(t)},Na=Math.min,ja=function(t){return t>0?Na(Fa(t),9007199254740991):0},za=Math.max,La=Math.min,Ra=function(t,e){var i=Fa(t);return i<0?za(i+e,0):La(i,e)},Ba=function(t){return function(e,i,n){var o,r=y(e),s=ja(r.length),a=Ra(n,s);if(t&&i!=i){for(;s>a;)if((o=r[a++])!=o)return !0}else for(;s>a;a++)if((t||a in r)&&r[a]===i)return t||a||0;return !t&&-1}},Ya={includes:Ba(!0),indexOf:Ba(!1)},Ha=Ya.indexOf,Wa=function(t,e){var i,n=y(t),o=0,r=[];for(i in n)!w(aa,i)&&w(n,i)&&r.push(i);for(;e.length>o;)w(n,i=e[o++])&&(~Ha(r,i)||r.push(i));return r},Va=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],Ua=Object.keys||function(t){return Wa(t,Va)},Ga=s?Object.defineProperties:function(t,e){z(t);for(var i,n=Ua(e),o=n.length,r=0;o>r;)R.f(t,i=n[r++],e[i]);return t},qa=function(t){return "function"==typeof t?t:void 0},Xa=function(t,e){return arguments.length<2?qa(F[t])||qa(o[t]):F[t]&&F[t][e]||o[t]&&o[t][e]},Za=Xa("document","documentElement"),Ka=sa("IE_PROTO"),$a=function(){},Ja=function(t){return "<script>"+t+"<\/script>"},Qa=function(){try{Ca=document.domain&&new ActiveXObject("htmlfile");}catch(t){}var t,e;Qa=Ca?function(t){t.write(Ja("")),t.close();var e=t.parentWindow.Object;return t=null,e}(Ca):((e=x("iframe")).style.display="none",Za.appendChild(e),e.src=String("javascript:"),(t=e.contentWindow.document).open(),t.write(Ja("document.F=Object")),t.close(),t.F);for(var i=Va.length;i--;)delete Qa.prototype[Va[i]];return Qa()};aa[Ka]=!0;var th=Object.create||function(t,e){var i;return null!==t?($a.prototype=z(t),i=new $a,$a.prototype=null,i[Ka]=t):i=Qa(),void 0===e?i:Ga(i,e)},eh={};eh[Da("toStringTag")]="z";var ih="[object z]"===String(eh),nh=Da("toStringTag"),oh="Arguments"==c(function(){return arguments}()),rh=ih?c:function(t){var e,i,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(i=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),nh))?i:oh?c(e):"Object"==(n=c(e))&&"function"==typeof e.callee?"Arguments":n},sh=ih?{}.toString:function(){return "[object "+rh(this)+"]"},ah=R.f,hh=Da("toStringTag"),lh=function(t,e,i,n){if(t){var o=i?t:t.prototype;w(o,hh)||ah(o,hh,{configurable:!0,value:e}),n&&!ih&&B(o,"toString",sh);}},dh=Pa.IteratorPrototype,uh=function(){return this},ch=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,i={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(i,[]),e=i instanceof Array;}catch(t){}return function(i,n){return z(i),function(t){if(!g(t)&&null!==t)throw TypeError("Can't set "+String(t)+" as a prototype")}(n),e?t.call(i,n):i.__proto__=n,i}}():void 0),fh=function(t,e,i,n){n&&n.enumerable?t[e]=i:B(t,e,i);},ph=Pa.IteratorPrototype,vh=Pa.BUGGY_SAFARI_ITERATORS,yh=Da("iterator"),gh=function(){return this},mh=function(t,e,i,n,o,r,s){!function(t,e,i){var n=e+" Iterator";t.prototype=th(dh,{next:d(1,i)}),lh(t,n,!1,!0),Gs[n]=uh;}(i,e,n);var a,h,l,u=function(t){if(t===o&&y)return y;if(!vh&&t in p)return p[t];switch(t){case"keys":case"values":case"entries":return function(){return new i(this,t)}}return function(){return new i(this)}},c=e+" Iterator",f=!1,p=t.prototype,v=p[yh]||p["@@iterator"]||o&&p[o],y=!vh&&v||u(o),g="Array"==e&&p.entries||v;if(g&&(a=ka(g.call(new t)),ph!==Object.prototype&&a.next&&(lh(a,c,!0,!0),Gs[c]=gh)),"values"==o&&v&&"values"!==v.name&&(f=!0,y=function(){return v.call(this)}),s&&p[yh]!==y&&B(p,yh,y),Gs[e]=y,o)if(h={values:u("values"),keys:r?y:u("keys"),entries:u("entries")},s)for(l in h)!vh&&!f&&l in p||fh(p,l,h[l]);else W({target:e,proto:!0,forced:vh||f},h);return h},bh=ga.set,wh=ga.getterFor("Array Iterator");mh(Array,"Array",(function(t,e){bh(this,{type:"Array Iterator",target:y(t),index:0,kind:e});}),(function(){var t=wh(this),e=t.target,i=t.kind,n=t.index++;return !e||n>=e.length?(t.target=void 0,{value:void 0,done:!0}):"keys"==i?{value:n,done:!1}:"values"==i?{value:e[n],done:!1}:{value:[n,e[n]],done:!1}}),"values");Gs.Arguments=Gs.Array;var _h=Da("toStringTag");for(var kh in {CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}){var xh=o[kh],Oh=xh&&xh.prototype;Oh&&!Oh[_h]&&B(Oh,_h,kh),Gs[kh]=Gs.Array;}var Sh=Array.isArray||function(t){return "Array"==c(t)},Mh=Da("species"),Eh=function(t,e){var i;return Sh(t)&&("function"!=typeof(i=t.constructor)||i!==Array&&!Sh(i.prototype)?g(i)&&null===(i=i[Mh])&&(i=void 0):i=void 0),new(void 0===i?Array:i)(0===e?0:e)},Dh=[].push,Th=function(t){var e=1==t,i=2==t,n=3==t,o=4==t,r=6==t,s=5==t||r;return function(a,h,l,d){for(var u,c,f=ma(a),v=p(f),y=j(h,l,3),g=ja(v.length),m=0,b=d||Eh,w=e?b(a,g):i?b(a,0):void 0;g>m;m++)if((s||m in v)&&(c=y(u=v[m],m,f),t))if(e)w[m]=c;else if(c)switch(t){case 3:return !0;case 5:return u;case 6:return m;case 2:Dh.call(w,u);}else if(o)return !1;return r?-1:n||o?o:w}},Ch={forEach:Th(0),map:Th(1),filter:Th(2),some:Th(3),every:Th(4),find:Th(5),findIndex:Th(6)},Ph=function(t,e){var i=[][t];return !i||!r((function(){i.call(null,e||function(){throw 1},1);}))},Ah=Ch.forEach,Ih=Ph("forEach")?function(t){return Ah(this,t,arguments.length>1?arguments[1]:void 0)}:[].forEach;W({target:"Array",proto:!0,forced:[].forEach!=Ih},{forEach:Ih});var Fh=X("Array").forEach,Nh=Array.prototype,jh={DOMTokenList:!0,NodeList:!0},zh=function(t){var e=t.forEach;return t===Nh||t instanceof Array&&e===Nh.forEach||jh.hasOwnProperty(rh(t))?Fh:e};W({target:"Array",stat:!0},{isArray:Sh});var Lh,Rh,Bh=F.Array.isArray,Yh=Bh,Hh=function(t,e,i){var n=m(e);n in t?R.f(t,n,d(0,i)):t[n]=i;},Wh=Xa("navigator","userAgent")||"",Vh=o.process,Uh=Vh&&Vh.versions,Gh=Uh&&Uh.v8;Gh?Rh=(Lh=Gh.split("."))[0]+Lh[1]:Wh&&(!(Lh=Wh.match(/Edge\/(\d+)/))||Lh[1]>=74)&&(Lh=Wh.match(/Chrome\/(\d+)/))&&(Rh=Lh[1]);var qh=Rh&&+Rh,Xh=Da("species"),Zh=function(t){return qh>=51||!r((function(){var e=[];return (e.constructor={})[Xh]=function(){return {foo:1}},1!==e[t](Boolean).foo}))},Kh=Math.max,$h=Math.min;W({target:"Array",proto:!0,forced:!Zh("splice")},{splice:function(t,e){var i,n,o,r,s,a,h=ma(this),l=ja(h.length),d=Ra(t,l),u=arguments.length;if(0===u?i=n=0:1===u?(i=0,n=l-d):(i=u-2,n=$h(Kh(Fa(e),0),l-d)),l+i-n>9007199254740991)throw TypeError("Maximum allowed length exceeded");for(o=Eh(h,n),r=0;r<n;r++)(s=d+r)in h&&Hh(o,r,h[s]);if(o.length=n,i<n){for(r=d;r<l-n;r++)a=r+i,(s=r+n)in h?h[a]=h[s]:delete h[a];for(r=l;r>l-n+i;r--)delete h[r-1];}else if(i>n)for(r=l-n;r>d;r--)a=r+i-1,(s=r+n-1)in h?h[a]=h[s]:delete h[a];for(r=0;r<i;r++)h[r+d]=arguments[r+2];return h.length=l-n+i,o}});var Jh=X("Array").splice,Qh=Array.prototype,tl=function(t){var e=t.splice;return t===Qh||t instanceof Array&&e===Qh.splice?Jh:e},el=Ya.includes;W({target:"Array",proto:!0},{includes:function(t){return el(this,t,arguments.length>1?arguments[1]:void 0)}});var il=X("Array").includes,nl=Da("match"),ol=function(t){if(function(t){var e;return g(t)&&(void 0!==(e=t[nl])?!!e:"RegExp"==c(t))}(t))throw TypeError("The method doesn't accept regular expressions");return t},rl=Da("match");W({target:"String",proto:!0,forced:!function(t){var e=/./;try{"/./"[t](e);}catch(i){try{return e[rl]=!1,"/./"[t](e)}catch(t){}}return !1}("includes")},{includes:function(t){return !!~String(v(this)).indexOf(ol(t),arguments.length>1?arguments[1]:void 0)}});var sl=X("String").includes,al=Array.prototype,hl=String.prototype,ll=function(t){var e=t.includes;return t===al||t instanceof Array&&e===al.includes?il:"string"==typeof t||t===hl||t instanceof String&&e===hl.includes?sl:e},dl=Ya.indexOf,ul=[].indexOf,cl=!!ul&&1/[1].indexOf(1,-0)<0,fl=Ph("indexOf");W({target:"Array",proto:!0,forced:cl||fl},{indexOf:function(t){return cl?ul.apply(this,arguments)||0:dl(this,t,arguments.length>1?arguments[1]:void 0)}});var pl=X("Array").indexOf,vl=Array.prototype,yl=function(t){var e=t.indexOf;return t===vl||t instanceof Array&&e===vl.indexOf?pl:e};W({target:"Object",stat:!0,sham:!s},{create:th});var gl=F.Object,ml=function(t,e){return gl.create(t,e)},bl=ml;function wl(t){return Sl=t,function(){var t={};Ml=0,void(El=Sl.charAt(0)),Rl(),"strict"===Dl&&(t.strict=!0,Rl());"graph"!==Dl&&"digraph"!==Dl||(t.type=Dl,Rl());Tl===xl.IDENTIFIER&&(t.id=Dl,Rl());if("{"!=Dl)throw Ul("Angle bracket { expected");if(Rl(),Bl(t),"}"!=Dl)throw Ul("Angle bracket } expected");if(Rl(),""!==Dl)throw Ul("End of file expected");return Rl(),delete t.node,delete t.edge,delete t.graph,t}()}var _l={fontsize:"font.size",fontcolor:"font.color",labelfontcolor:"font.color",fontname:"font.face",color:["color.border","color.background"],fillcolor:"color.background",tooltip:"title",labeltooltip:"title"},kl=bl(_l);kl.color="color.color",kl.style="dashes";var xl={NULL:0,DELIMITER:1,IDENTIFIER:2,UNKNOWN:3},Ol={"{":!0,"}":!0,"[":!0,"]":!0,";":!0,"=":!0,",":!0,"->":!0,"--":!0},Sl="",Ml=0,El="",Dl="",Tl=xl.NULL;function Cl(){Ml++,El=Sl.charAt(Ml);}function Pl(){return Sl.charAt(Ml+1)}var Al=/[a-zA-Z_0-9.:#]/;function Il(t){return Al.test(t)}function Fl(t,e){if(t||(t={}),e)for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i]);return t}function Nl(t,e,i){for(var n=e.split("."),o=t;n.length;){var r=n.shift();n.length?(o[r]||(o[r]={}),o=o[r]):o[r]=i;}}function jl(t,e){for(var i,n,o=null,r=[t],s=t;s.parent;)r.push(s.parent),s=s.parent;if(s.nodes)for(i=0,n=s.nodes.length;i<n;i++)if(e.id===s.nodes[i].id){o=s.nodes[i];break}for(o||(o={id:e.id},t.node&&(o.attr=Fl(o.attr,t.node))),i=r.length-1;i>=0;i--){var a,h=r[i];h.nodes||(h.nodes=[]),-1===yl(a=h.nodes).call(a,o)&&h.nodes.push(o);}e.attr&&(o.attr=Fl(o.attr,e.attr));}function zl(t,e){if(t.edges||(t.edges=[]),t.edges.push(e),t.edge){var i=Fl({},t.edge);e.attr=Fl(i,e.attr);}}function Ll(t,e,i,n,o){var r={from:e,to:i,type:n};return t.edge&&(r.attr=Fl({},t.edge)),r.attr=Fl(r.attr||{},o),null!=o&&o.hasOwnProperty("arrows")&&null!=o.arrows&&(r.arrows={to:{enabled:!0,type:o.arrows.type}},o.arrows=null),r}function Rl(){for(Tl=xl.NULL,Dl="";" "===El||"\t"===El||"\n"===El||"\r"===El;)Cl();do{var t=!1;if("#"===El){for(var e=Ml-1;" "===Sl.charAt(e)||"\t"===Sl.charAt(e);)e--;if("\n"===Sl.charAt(e)||""===Sl.charAt(e)){for(;""!=El&&"\n"!=El;)Cl();t=!0;}}if("/"===El&&"/"===Pl()){for(;""!=El&&"\n"!=El;)Cl();t=!0;}if("/"===El&&"*"===Pl()){for(;""!=El;){if("*"===El&&"/"===Pl()){Cl(),Cl();break}Cl();}t=!0;}for(;" "===El||"\t"===El||"\n"===El||"\r"===El;)Cl();}while(t);if(""!==El){var i=El+Pl();if(Ol[i])return Tl=xl.DELIMITER,Dl=i,Cl(),void Cl();if(Ol[El])return Tl=xl.DELIMITER,Dl=El,void Cl();if(Il(El)||"-"===El){for(Dl+=El,Cl();Il(El);)Dl+=El,Cl();return "false"===Dl?Dl=!1:"true"===Dl?Dl=!0:isNaN(Number(Dl))||(Dl=Number(Dl)),void(Tl=xl.IDENTIFIER)}if('"'===El){for(Cl();""!=El&&('"'!=El||'"'===El&&'"'===Pl());)'"'===El?(Dl+=El,Cl()):"\\"===El&&"n"===Pl()?(Dl+="\n",Cl()):Dl+=El,Cl();if('"'!=El)throw Ul('End of string " expected');return Cl(),void(Tl=xl.IDENTIFIER)}for(Tl=xl.UNKNOWN;""!=El;)Dl+=El,Cl();throw new SyntaxError('Syntax error in part "'+Gl(Dl,30)+'"')}Tl=xl.DELIMITER;}function Bl(t){for(;""!==Dl&&"}"!=Dl;)Yl(t),";"===Dl&&Rl();}function Yl(t){var e=Hl(t);if(e)Wl(t,e);else if(!function(t){if("node"===Dl)return Rl(),t.node=Vl(),"node";if("edge"===Dl)return Rl(),t.edge=Vl(),"edge";if("graph"===Dl)return Rl(),t.graph=Vl(),"graph";return null}(t)){if(Tl!=xl.IDENTIFIER)throw Ul("Identifier expected");var i=Dl;if(Rl(),"="===Dl){if(Rl(),Tl!=xl.IDENTIFIER)throw Ul("Identifier expected");t[i]=Dl,Rl();}else!function(t,e){var i={id:e},n=Vl();n&&(i.attr=n);jl(t,i),Wl(t,e);}(t,i);}}function Hl(t){var e=null;if("subgraph"===Dl&&((e={}).type="subgraph",Rl(),Tl===xl.IDENTIFIER&&(e.id=Dl,Rl())),"{"===Dl){if(Rl(),e||(e={}),e.parent=t,e.node=t.node,e.edge=t.edge,e.graph=t.graph,Bl(e),"}"!=Dl)throw Ul("Angle bracket } expected");Rl(),delete e.node,delete e.edge,delete e.graph,delete e.parent,t.subgraphs||(t.subgraphs=[]),t.subgraphs.push(e);}return e}function Wl(t,e){for(;"->"===Dl||"--"===Dl;){var i,n=Dl;Rl();var o=Hl(t);if(o)i=o;else{if(Tl!=xl.IDENTIFIER)throw Ul("Identifier or subgraph expected");jl(t,{id:i=Dl}),Rl();}zl(t,Ll(t,e,i,n,Vl())),e=i;}}function Vl(){for(var t,e,i=null,n={dashed:!0,solid:!1,dotted:[1,5]},o={dot:"circle",box:"box",crow:"crow",curve:"curve",icurve:"inv_curve",normal:"triangle",inv:"inv_triangle",diamond:"diamond",tee:"bar",vee:"vee"},r=new Array,s=new Array;"["===Dl;){for(Rl(),i={};""!==Dl&&"]"!=Dl;){if(Tl!=xl.IDENTIFIER)throw Ul("Attribute name expected");var a=Dl;if(Rl(),"="!=Dl)throw Ul("Equal sign = expected");if(Rl(),Tl!=xl.IDENTIFIER)throw Ul("Attribute value expected");var h=Dl;"style"===a&&(h=n[h]),"arrowhead"===a&&(a="arrows",h={to:{enabled:!0,type:o[h]}}),"arrowtail"===a&&(a="arrows",h={from:{enabled:!0,type:o[h]}}),r.push({attr:i,name:a,value:h}),s.push(a),Rl(),","==Dl&&Rl();}if("]"!=Dl)throw Ul("Bracket ] expected");Rl();}if(ll(s).call(s,"dir")){var l={arrows:{}};for(t=0;t<r.length;t++)if("arrows"===r[t].name)if(null!=r[t].value.to)l.arrows.to=t;else{if(null==r[t].value.from)throw Ul("Invalid value of arrows");l.arrows.from=t;}else"dir"===r[t].name&&(l.dir=t);var d,u,c=r[l.dir].value;if(!ll(s).call(s,"arrows"))if("both"===c)r.push({attr:r[l.dir].attr,name:"arrows",value:{to:{enabled:!0}}}),l.arrows.to=r.length-1,r.push({attr:r[l.dir].attr,name:"arrows",value:{from:{enabled:!0}}}),l.arrows.from=r.length-1;else if("forward"===c)r.push({attr:r[l.dir].attr,name:"arrows",value:{to:{enabled:!0}}}),l.arrows.to=r.length-1;else if("back"===c)r.push({attr:r[l.dir].attr,name:"arrows",value:{from:{enabled:!0}}}),l.arrows.from=r.length-1;else{if("none"!==c)throw Ul('Invalid dir type "'+c+'"');r.push({attr:r[l.dir].attr,name:"arrows",value:""}),l.arrows.to=r.length-1;}if("both"===c)l.arrows.to&&l.arrows.from?(u=r[l.arrows.to].value.to.type,d=r[l.arrows.from].value.from.type,r[l.arrows.to]={attr:r[l.arrows.to].attr,name:r[l.arrows.to].name,value:{to:{enabled:!0,type:u},from:{enabled:!0,type:d}}},tl(r).call(r,l.arrows.from,1)):l.arrows.to?(u=r[l.arrows.to].value.to.type,d="arrow",r[l.arrows.to]={attr:r[l.arrows.to].attr,name:r[l.arrows.to].name,value:{to:{enabled:!0,type:u},from:{enabled:!0,type:d}}}):l.arrows.from&&(u="arrow",d=r[l.arrows.from].value.from.type,r[l.arrows.from]={attr:r[l.arrows.from].attr,name:r[l.arrows.from].name,value:{to:{enabled:!0,type:u},from:{enabled:!0,type:d}}});else if("back"===c)l.arrows.to&&l.arrows.from?(u="",d=r[l.arrows.from].value.from.type,r[l.arrows.from]={attr:r[l.arrows.from].attr,name:r[l.arrows.from].name,value:{to:{enabled:!0,type:u},from:{enabled:!0,type:d}}}):l.arrows.to?(u="",d="arrow",l.arrows.from=l.arrows.to,r[l.arrows.from]={attr:r[l.arrows.from].attr,name:r[l.arrows.from].name,value:{to:{enabled:!0,type:u},from:{enabled:!0,type:d}}}):l.arrows.from&&(u="",d=r[l.arrows.from].value.from.type,r[l.arrows.to]={attr:r[l.arrows.from].attr,name:r[l.arrows.from].name,value:{to:{enabled:!0,type:u},from:{enabled:!0,type:d}}}),r[l.arrows.from]={attr:r[l.arrows.from].attr,name:r[l.arrows.from].name,value:{from:{enabled:!0,type:r[l.arrows.from].value.from.type}}};else if("none"===c){var f;r[f=l.arrows.to?l.arrows.to:l.arrows.from]={attr:r[f].attr,name:r[f].name,value:""};}else{if("forward"!==c)throw Ul('Invalid dir type "'+c+'"');l.arrows.to&&l.arrows.from?(u=r[l.arrows.to].value.to.type,d="",r[l.arrows.to]={attr:r[l.arrows.to].attr,name:r[l.arrows.to].name,value:{to:{enabled:!0,type:u},from:{enabled:!0,type:d}}}):l.arrows.to?(u=r[l.arrows.to].value.to.type,d="",r[l.arrows.to]={attr:r[l.arrows.to].attr,name:r[l.arrows.to].name,value:{to:{enabled:!0,type:u},from:{enabled:!0,type:d}}}):l.arrows.from&&(u="arrow",d="",l.arrows.to=l.arrows.from,r[l.arrows.to]={attr:r[l.arrows.to].attr,name:r[l.arrows.to].name,value:{to:{enabled:!0,type:u},from:{enabled:!0,type:d}}}),r[l.arrows.to]={attr:r[l.arrows.to].attr,name:r[l.arrows.to].name,value:{to:{enabled:!0,type:r[l.arrows.to].value.to.type}}};}tl(r).call(r,l.dir,1);}if(ll(s).call(s,"penwidth")){var p=[];for(e=r.length,t=0;t<e;t++)"width"!==r[t].name&&("penwidth"===r[t].name&&(r[t].name="width"),p.push(r[t]));r=p;}for(e=r.length,t=0;t<e;t++)Nl(r[t].attr,r[t].name,r[t].value);return i}function Ul(t){return new SyntaxError(t+', got "'+Gl(Dl,30)+'" (char '+Ml+")")}function Gl(t,e){return t.length<=e?t:t.substr(0,27)+"..."}function ql(t,e,i){for(var n=e.split("."),o=n.pop(),r=t,s=0;s<n.length;s++){var a=n[s];a in r||(r[a]={}),r=r[a];}return r[o]=i,t}function Xl(t,e){var i={};for(var n in t)if(t.hasOwnProperty(n)){var o=e[n];Yh(o)?zh(o).call(o,(function(e){ql(i,e,t[n]);})):ql(i,"string"==typeof o?o:n,t[n]);}return i}var Zl=wl,Kl=function(t){var e,i=wl(t),n={nodes:[],edges:[],options:{}};if(i.nodes&&zh(e=i.nodes).call(e,(function(t){var e={id:t.id,label:String(t.label||t.id)};Fl(e,Xl(t.attr,_l)),e.image&&(e.shape="image"),n.nodes.push(e);})),i.edges){var o,r=function(t){var e={from:t.from,to:t.to};return Fl(e,Xl(t.attr,kl)),null==e.arrows&&"->"===t.type&&(e.arrows="to"),e};zh(o=i.edges).call(o,(function(t){var e,i,o,s,a,h,l;(e=t.from instanceof Object?t.from.nodes:{id:t.from},i=t.to instanceof Object?t.to.nodes:{id:t.to},t.from instanceof Object&&t.from.edges)&&zh(o=t.from.edges).call(o,(function(t){var e=r(t);n.edges.push(e);}));(a=i,h=function(e,i){var o=Ll(n,e.id,i.id,t.type,t.attr),s=r(o);n.edges.push(s);},Yh(s=e)?zh(s).call(s,(function(t){Yh(a)?zh(a).call(a,(function(e){h(t,e);})):h(t,a);})):Yh(a)?zh(a).call(a,(function(t){h(s,t);})):h(s,a),t.to instanceof Object&&t.to.edges)&&zh(l=t.to.edges).call(l,(function(t){var e=r(t);n.edges.push(e);}));}));}return i.attr&&(n.options=i.attr),n},$l={parseDOT:Zl,DOTToGraph:Kl},Jl=Object.freeze({__proto__:null,default:$l,__moduleExports:$l,parseDOT:Zl,DOTToGraph:Kl}),Ql=Ch.map,td=Zh("map"),ed=td&&!r((function(){[].map.call({length:-1,0:1},(function(t){throw t}));}));W({target:"Array",proto:!0,forced:!td||!ed},{map:function(t){return Ql(this,t,arguments.length>1?arguments[1]:void 0)}});var id=X("Array").map,nd=Array.prototype,od=function(t){var e=t.map;return t===nd||t instanceof Array&&e===nd.map?id:e};function rd(t,e){var i,n={edges:{inheritColor:!1},nodes:{fixed:!1,parseColor:!1}};null!=e&&(null!=e.fixed&&(n.nodes.fixed=e.fixed),null!=e.parseColor&&(n.nodes.parseColor=e.parseColor),null!=e.inheritColor&&(n.edges.inheritColor=e.inheritColor));var o=t.edges,r=od(o).call(o,(function(t){var e={from:t.source,id:t.id,to:t.target};return null!=t.attributes&&(e.attributes=t.attributes),null!=t.label&&(e.label=t.label),null!=t.attributes&&null!=t.attributes.title&&(e.title=t.attributes.title),"Directed"===t.type&&(e.arrows="to"),t.color&&!1===n.edges.inheritColor&&(e.color=t.color),e}));return {nodes:od(i=t.nodes).call(i,(function(t){var e={id:t.id,fixed:n.nodes.fixed&&null!=t.x&&null!=t.y};return null!=t.attributes&&(e.attributes=t.attributes),null!=t.label&&(e.label=t.label),null!=t.size&&(e.size=t.size),null!=t.attributes&&null!=t.attributes.title&&(e.title=t.attributes.title),null!=t.title&&(e.title=t.title),null!=t.x&&(e.x=t.x),null!=t.y&&(e.y=t.y),null!=t.color&&(!0===n.nodes.parseColor?e.color=t.color:e.color={background:t.color,border:t.color,highlight:{background:t.color,border:t.color},hover:{background:t.color,border:t.color}}),e})),edges:r}}var sd=Object.freeze({__proto__:null,parseGephi:rd}),ad=Object.freeze({__proto__:null,default:void 0}),hd=i((function(t,e){t.exports=function(t){var e,i=t&&t.preventDefault||!1,n=t&&t.container||window,o={},r={keydown:{},keyup:{}},s={};for(e=97;e<=122;e++)s[String.fromCharCode(e)]={code:e-97+65,shift:!1};for(e=65;e<=90;e++)s[String.fromCharCode(e)]={code:e,shift:!0};for(e=0;e<=9;e++)s[""+e]={code:48+e,shift:!1};for(e=1;e<=12;e++)s["F"+e]={code:111+e,shift:!1};for(e=0;e<=9;e++)s["num"+e]={code:96+e,shift:!1};s["num*"]={code:106,shift:!1},s["num+"]={code:107,shift:!1},s["num-"]={code:109,shift:!1},s["num/"]={code:111,shift:!1},s["num."]={code:110,shift:!1},s.left={code:37,shift:!1},s.up={code:38,shift:!1},s.right={code:39,shift:!1},s.down={code:40,shift:!1},s.space={code:32,shift:!1},s.enter={code:13,shift:!1},s.shift={code:16,shift:void 0},s.esc={code:27,shift:!1},s.backspace={code:8,shift:!1},s.tab={code:9,shift:!1},s.ctrl={code:17,shift:!1},s.alt={code:18,shift:!1},s.delete={code:46,shift:!1},s.pageup={code:33,shift:!1},s.pagedown={code:34,shift:!1},s["="]={code:187,shift:!1},s["-"]={code:189,shift:!1},s["]"]={code:221,shift:!1},s["["]={code:219,shift:!1};var a=function(t){l(t,"keydown");},h=function(t){l(t,"keyup");},l=function(t,e){if(void 0!==r[e][t.keyCode]){for(var n=r[e][t.keyCode],o=0;o<n.length;o++)void 0===n[o].shift?n[o].fn(t):1==n[o].shift&&1==t.shiftKey?n[o].fn(t):0==n[o].shift&&0==t.shiftKey&&n[o].fn(t);1==i&&t.preventDefault();}};return o.bind=function(t,e,i){if(void 0===i&&(i="keydown"),void 0===s[t])throw new Error("unsupported key: "+t);void 0===r[i][s[t].code]&&(r[i][s[t].code]=[]),r[i][s[t].code].push({fn:e,shift:s[t].shift});},o.bindAll=function(t,e){for(var i in void 0===e&&(e="keydown"),s)s.hasOwnProperty(i)&&o.bind(i,t,e);},o.getKey=function(t){for(var e in s)if(s.hasOwnProperty(e)){if(1==t.shiftKey&&1==s[e].shift&&t.keyCode==s[e].code)return e;if(0==t.shiftKey&&0==s[e].shift&&t.keyCode==s[e].code)return e;if(t.keyCode==s[e].code&&"shift"==e)return e}return "unknown key, currently not supported"},o.unbind=function(t,e,i){if(void 0===i&&(i="keydown"),void 0===s[t])throw new Error("unsupported key: "+t);if(void 0!==e){var n=[],o=r[i][s[t].code];if(void 0!==o)for(var a=0;a<o.length;a++)o[a].fn==e&&o[a].shift==s[t].shift||n.push(r[i][s[t].code][a]);r[i][s[t].code]=n;}else r[i][s[t].code]=[];},o.reset=function(){r={keydown:{},keyup:{}};},o.destroy=function(){r={keydown:{},keyup:{}},n.removeEventListener("keydown",a,!0),n.removeEventListener("keyup",h,!0);},n.addEventListener("keydown",a,!0),n.addEventListener("keyup",h,!0),o};})),ld=Object.freeze({__proto__:null,default:hd,__moduleExports:hd});function dd(){return (dd=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var n in i)Object.prototype.hasOwnProperty.call(i,n)&&(t[n]=i[n]);}return t}).apply(this,arguments)}function ud(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,t.__proto__=e;}function cd(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}var fd,pd="function"!=typeof Object.assign?function(t){if(null==t)throw new TypeError("Cannot convert undefined or null to object");for(var e=Object(t),i=1;i<arguments.length;i++){var n=arguments[i];if(null!=n)for(var o in n)n.hasOwnProperty(o)&&(e[o]=n[o]);}return e}:Object.assign,vd=["","webkit","Moz","MS","ms","o"],yd="undefined"==typeof document?{style:{}}:document.createElement("div"),gd="function",md=Math.round,bd=Math.abs,wd=Date.now;function _d(t,e){for(var i,n,o=e[0].toUpperCase()+e.slice(1),r=0;r<vd.length;){if((n=(i=vd[r])?i+o:e)in t)return n;r++;}}fd="undefined"==typeof window?{}:window;var kd=_d(yd.style,"touchAction"),xd=void 0!==kd;var Od="auto",Sd="manipulation",Md="none",Ed="pan-x",Dd="pan-y",Td=function(){if(!xd)return !1;var t={},e=fd.CSS&&fd.CSS.supports;return ["auto","manipulation","pan-y","pan-x","pan-x pan-y","none"].forEach((function(i){return t[i]=!e||fd.CSS.supports("touch-action",i)})),t}(),Cd="ontouchstart"in fd,Pd=void 0!==_d(fd,"PointerEvent"),Ad=Cd&&/mobile|tablet|ip(ad|hone|od)|android/i.test(navigator.userAgent),Id="touch",Fd="mouse",Nd=25,jd=1,zd=2,Ld=4,Rd=8,Bd=1,Yd=2,Hd=4,Wd=8,Vd=16,Ud=Yd|Hd,Gd=Wd|Vd,qd=Ud|Gd,Xd=["x","y"],Zd=["clientX","clientY"];function Kd(t,e,i){var n;if(t)if(t.forEach)t.forEach(e,i);else if(void 0!==t.length)for(n=0;n<t.length;)e.call(i,t[n],n,t),n++;else for(n in t)t.hasOwnProperty(n)&&e.call(i,t[n],n,t);}function $d(t,e){return typeof t===gd?t.apply(e&&e[0]||void 0,e):t}function Jd(t,e){return t.indexOf(e)>-1}var Qd=function(){function t(t,e){this.manager=t,this.set(e);}var e=t.prototype;return e.set=function(t){"compute"===t&&(t=this.compute()),xd&&this.manager.element.style&&Td[t]&&(this.manager.element.style[kd]=t),this.actions=t.toLowerCase().trim();},e.update=function(){this.set(this.manager.options.touchAction);},e.compute=function(){var t=[];return Kd(this.manager.recognizers,(function(e){$d(e.options.enable,[e])&&(t=t.concat(e.getTouchAction()));})),function(t){if(Jd(t,Md))return Md;var e=Jd(t,Ed),i=Jd(t,Dd);return e&&i?Md:e||i?e?Ed:Dd:Jd(t,Sd)?Sd:Od}(t.join(" "))},e.preventDefaults=function(t){var e=t.srcEvent,i=t.offsetDirection;if(this.manager.session.prevented)e.preventDefault();else{var n=this.actions,o=Jd(n,Md)&&!Td[Md],r=Jd(n,Dd)&&!Td[Dd],s=Jd(n,Ed)&&!Td[Ed];if(o){var a=1===t.pointers.length,h=t.distance<2,l=t.deltaTime<250;if(a&&h&&l)return}if(!s||!r)return o||r&&i&Ud||s&&i&Gd?this.preventSrc(e):void 0}},e.preventSrc=function(t){this.manager.session.prevented=!0,t.preventDefault();},t}();function tu(t,e){for(;t;){if(t===e)return !0;t=t.parentNode;}return !1}function eu(t){var e=t.length;if(1===e)return {x:md(t[0].clientX),y:md(t[0].clientY)};for(var i=0,n=0,o=0;o<e;)i+=t[o].clientX,n+=t[o].clientY,o++;return {x:md(i/e),y:md(n/e)}}function iu(t){for(var e=[],i=0;i<t.pointers.length;)e[i]={clientX:md(t.pointers[i].clientX),clientY:md(t.pointers[i].clientY)},i++;return {timeStamp:wd(),pointers:e,center:eu(e),deltaX:t.deltaX,deltaY:t.deltaY}}function nu(t,e,i){i||(i=Xd);var n=e[i[0]]-t[i[0]],o=e[i[1]]-t[i[1]];return Math.sqrt(n*n+o*o)}function ou(t,e,i){i||(i=Xd);var n=e[i[0]]-t[i[0]],o=e[i[1]]-t[i[1]];return 180*Math.atan2(o,n)/Math.PI}function ru(t,e){return t===e?Bd:bd(t)>=bd(e)?t<0?Yd:Hd:e<0?Wd:Vd}function su(t,e,i){return {x:e/t||0,y:i/t||0}}function au(t,e){var i=t.session,n=e.pointers,o=n.length;i.firstInput||(i.firstInput=iu(e)),o>1&&!i.firstMultiple?i.firstMultiple=iu(e):1===o&&(i.firstMultiple=!1);var r=i.firstInput,s=i.firstMultiple,a=s?s.center:r.center,h=e.center=eu(n);e.timeStamp=wd(),e.deltaTime=e.timeStamp-r.timeStamp,e.angle=ou(a,h),e.distance=nu(a,h),function(t,e){var i=e.center,n=t.offsetDelta||{},o=t.prevDelta||{},r=t.prevInput||{};e.eventType!==jd&&r.eventType!==Ld||(o=t.prevDelta={x:r.deltaX||0,y:r.deltaY||0},n=t.offsetDelta={x:i.x,y:i.y}),e.deltaX=o.x+(i.x-n.x),e.deltaY=o.y+(i.y-n.y);}(i,e),e.offsetDirection=ru(e.deltaX,e.deltaY);var l,d,u=su(e.deltaTime,e.deltaX,e.deltaY);e.overallVelocityX=u.x,e.overallVelocityY=u.y,e.overallVelocity=bd(u.x)>bd(u.y)?u.x:u.y,e.scale=s?(l=s.pointers,nu((d=n)[0],d[1],Zd)/nu(l[0],l[1],Zd)):1,e.rotation=s?function(t,e){return ou(e[1],e[0],Zd)+ou(t[1],t[0],Zd)}(s.pointers,n):0,e.maxPointers=i.prevInput?e.pointers.length>i.prevInput.maxPointers?e.pointers.length:i.prevInput.maxPointers:e.pointers.length,function(t,e){var i,n,o,r,s=t.lastInterval||e,a=e.timeStamp-s.timeStamp;if(e.eventType!==Rd&&(a>Nd||void 0===s.velocity)){var h=e.deltaX-s.deltaX,l=e.deltaY-s.deltaY,d=su(a,h,l);n=d.x,o=d.y,i=bd(d.x)>bd(d.y)?d.x:d.y,r=ru(h,l),t.lastInterval=e;}else i=s.velocity,n=s.velocityX,o=s.velocityY,r=s.direction;e.velocity=i,e.velocityX=n,e.velocityY=o,e.direction=r;}(i,e);var c,f=t.element,p=e.srcEvent;tu(c=p.composedPath?p.composedPath()[0]:p.path?p.path[0]:p.target,f)&&(f=c),e.target=f;}function hu(t,e,i){var n=i.pointers.length,o=i.changedPointers.length,r=e&jd&&n-o==0,s=e&(Ld|Rd)&&n-o==0;i.isFirst=!!r,i.isFinal=!!s,r&&(t.session={}),i.eventType=e,au(t,i),t.emit("hammer.input",i),t.recognize(i),t.session.prevInput=i;}function lu(t){return t.trim().split(/\s+/g)}function du(t,e,i){Kd(lu(e),(function(e){t.addEventListener(e,i,!1);}));}function uu(t,e,i){Kd(lu(e),(function(e){t.removeEventListener(e,i,!1);}));}function cu(t){var e=t.ownerDocument||t;return e.defaultView||e.parentWindow||window}var fu=function(){function t(t,e){var i=this;this.manager=t,this.callback=e,this.element=t.element,this.target=t.options.inputTarget,this.domHandler=function(e){$d(t.options.enable,[t])&&i.handler(e);},this.init();}var e=t.prototype;return e.handler=function(){},e.init=function(){this.evEl&&du(this.element,this.evEl,this.domHandler),this.evTarget&&du(this.target,this.evTarget,this.domHandler),this.evWin&&du(cu(this.element),this.evWin,this.domHandler);},e.destroy=function(){this.evEl&&uu(this.element,this.evEl,this.domHandler),this.evTarget&&uu(this.target,this.evTarget,this.domHandler),this.evWin&&uu(cu(this.element),this.evWin,this.domHandler);},t}();function pu(t,e,i){if(t.indexOf&&!i)return t.indexOf(e);for(var n=0;n<t.length;){if(i&&t[n][i]==e||!i&&t[n]===e)return n;n++;}return -1}var vu={pointerdown:jd,pointermove:zd,pointerup:Ld,pointercancel:Rd,pointerout:Rd},yu={2:Id,3:"pen",4:Fd,5:"kinect"},gu="pointerdown",mu="pointermove pointerup pointercancel";fd.MSPointerEvent&&!fd.PointerEvent&&(gu="MSPointerDown",mu="MSPointerMove MSPointerUp MSPointerCancel");var bu=function(t){function e(){var i,n=e.prototype;return n.evEl=gu,n.evWin=mu,(i=t.apply(this,arguments)||this).store=i.manager.session.pointerEvents=[],i}return ud(e,t),e.prototype.handler=function(t){var e=this.store,i=!1,n=t.type.toLowerCase().replace("ms",""),o=vu[n],r=yu[t.pointerType]||t.pointerType,s=r===Id,a=pu(e,t.pointerId,"pointerId");o&jd&&(0===t.button||s)?a<0&&(e.push(t),a=e.length-1):o&(Ld|Rd)&&(i=!0),a<0||(e[a]=t,this.callback(this.manager,o,{pointers:e,changedPointers:[t],pointerType:r,srcEvent:t}),i&&e.splice(a,1));},e}(fu);function wu(t){return Array.prototype.slice.call(t,0)}function _u(t,e,i){for(var n=[],o=[],r=0;r<t.length;){var s=e?t[r][e]:t[r];pu(o,s)<0&&n.push(t[r]),o[r]=s,r++;}return i&&(n=e?n.sort((function(t,i){return t[e]>i[e]})):n.sort()),n}var ku={touchstart:jd,touchmove:zd,touchend:Ld,touchcancel:Rd},xu="touchstart touchmove touchend touchcancel",Ou=function(t){function e(){var i;return e.prototype.evTarget=xu,(i=t.apply(this,arguments)||this).targetIds={},i}return ud(e,t),e.prototype.handler=function(t){var e=ku[t.type],i=Su.call(this,t,e);i&&this.callback(this.manager,e,{pointers:i[0],changedPointers:i[1],pointerType:Id,srcEvent:t});},e}(fu);function Su(t,e){var i,n,o=wu(t.touches),r=this.targetIds;if(e&(jd|zd)&&1===o.length)return r[o[0].identifier]=!0,[o,o];var s=wu(t.changedTouches),a=[],h=this.target;if(n=o.filter((function(t){return tu(t.target,h)})),e===jd)for(i=0;i<n.length;)r[n[i].identifier]=!0,i++;for(i=0;i<s.length;)r[s[i].identifier]&&a.push(s[i]),e&(Ld|Rd)&&delete r[s[i].identifier],i++;return a.length?[_u(n.concat(a),"identifier",!0),a]:void 0}var Mu={mousedown:jd,mousemove:zd,mouseup:Ld},Eu="mousedown",Du="mousemove mouseup",Tu=function(t){function e(){var i,n=e.prototype;return n.evEl=Eu,n.evWin=Du,(i=t.apply(this,arguments)||this).pressed=!1,i}return ud(e,t),e.prototype.handler=function(t){var e=Mu[t.type];e&jd&&0===t.button&&(this.pressed=!0),e&zd&&1!==t.which&&(e=Ld),this.pressed&&(e&Ld&&(this.pressed=!1),this.callback(this.manager,e,{pointers:[t],changedPointers:[t],pointerType:Fd,srcEvent:t}));},e}(fu),Cu=2500,Pu=25;function Au(t){var e=t.changedPointers[0];if(e.identifier===this.primaryTouch){var i={x:e.clientX,y:e.clientY},n=this.lastTouches;this.lastTouches.push(i);setTimeout((function(){var t=n.indexOf(i);t>-1&&n.splice(t,1);}),Cu);}}function Iu(t,e){t&jd?(this.primaryTouch=e.changedPointers[0].identifier,Au.call(this,e)):t&(Ld|Rd)&&Au.call(this,e);}function Fu(t){for(var e=t.srcEvent.clientX,i=t.srcEvent.clientY,n=0;n<this.lastTouches.length;n++){var o=this.lastTouches[n],r=Math.abs(e-o.x),s=Math.abs(i-o.y);if(r<=Pu&&s<=Pu)return !0}return !1}var Nu=function(){return function(t){function e(e,i){var n;return (n=t.call(this,e,i)||this).handler=function(t,e,i){var o=i.pointerType===Id,r=i.pointerType===Fd;if(!(r&&i.sourceCapabilities&&i.sourceCapabilities.firesTouchEvents)){if(o)Iu.call(cd(cd(n)),e,i);else if(r&&Fu.call(cd(cd(n)),i))return;n.callback(t,e,i);}},n.touch=new Ou(n.manager,n.handler),n.mouse=new Tu(n.manager,n.handler),n.primaryTouch=null,n.lastTouches=[],n}return ud(e,t),e.prototype.destroy=function(){this.touch.destroy(),this.mouse.destroy();},e}(fu)}();function ju(t,e,i){return !!Array.isArray(t)&&(Kd(t,i[e],i),!0)}var zu=1,Lu=2,Ru=4,Bu=8,Yu=Bu,Hu=16,Wu=1;function Vu(t,e){var i=e.manager;return i?i.get(t):t}function Uu(t){return t&Hu?"cancel":t&Bu?"end":t&Ru?"move":t&Lu?"start":""}var Gu=function(){function t(t){void 0===t&&(t={}),this.options=dd({enable:!0},t),this.id=Wu++,this.manager=null,this.state=zu,this.simultaneous={},this.requireFail=[];}var e=t.prototype;return e.set=function(t){return pd(this.options,t),this.manager&&this.manager.touchAction.update(),this},e.recognizeWith=function(t){if(ju(t,"recognizeWith",this))return this;var e=this.simultaneous;return e[(t=Vu(t,this)).id]||(e[t.id]=t,t.recognizeWith(this)),this},e.dropRecognizeWith=function(t){return ju(t,"dropRecognizeWith",this)?this:(t=Vu(t,this),delete this.simultaneous[t.id],this)},e.requireFailure=function(t){if(ju(t,"requireFailure",this))return this;var e=this.requireFail;return -1===pu(e,t=Vu(t,this))&&(e.push(t),t.requireFailure(this)),this},e.dropRequireFailure=function(t){if(ju(t,"dropRequireFailure",this))return this;t=Vu(t,this);var e=pu(this.requireFail,t);return e>-1&&this.requireFail.splice(e,1),this},e.hasRequireFailures=function(){return this.requireFail.length>0},e.canRecognizeWith=function(t){return !!this.simultaneous[t.id]},e.emit=function(t){var e=this,i=this.state;function n(i){e.manager.emit(i,t);}i<Bu&&n(e.options.event+Uu(i)),n(e.options.event),t.additionalEvent&&n(t.additionalEvent),i>=Bu&&n(e.options.event+Uu(i));},e.tryEmit=function(t){if(this.canEmit())return this.emit(t);this.state=32;},e.canEmit=function(){for(var t=0;t<this.requireFail.length;){if(!(this.requireFail[t].state&(32|zu)))return !1;t++;}return !0},e.recognize=function(t){var e=pd({},t);if(!$d(this.options.enable,[this,e]))return this.reset(),void(this.state=32);this.state&(Yu|Hu|32)&&(this.state=zu),this.state=this.process(e),this.state&(Lu|Ru|Bu|Hu)&&this.tryEmit(e);},e.process=function(t){},e.getTouchAction=function(){},e.reset=function(){},t}(),qu=function(t){function e(e){var i;return void 0===e&&(e={}),(i=t.call(this,dd({event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10},e))||this).pTime=!1,i.pCenter=!1,i._timer=null,i._input=null,i.count=0,i}ud(e,t);var i=e.prototype;return i.getTouchAction=function(){return [Sd]},i.process=function(t){var e=this,i=this.options,n=t.pointers.length===i.pointers,o=t.distance<i.threshold,r=t.deltaTime<i.time;if(this.reset(),t.eventType&jd&&0===this.count)return this.failTimeout();if(o&&r&&n){if(t.eventType!==Ld)return this.failTimeout();var s=!this.pTime||t.timeStamp-this.pTime<i.interval,a=!this.pCenter||nu(this.pCenter,t.center)<i.posThreshold;if(this.pTime=t.timeStamp,this.pCenter=t.center,a&&s?this.count+=1:this.count=1,this._input=t,0===this.count%i.taps)return this.hasRequireFailures()?(this._timer=setTimeout((function(){e.state=Yu,e.tryEmit();}),i.interval),Lu):Yu}return 32},i.failTimeout=function(){var t=this;return this._timer=setTimeout((function(){t.state=32;}),this.options.interval),32},i.reset=function(){clearTimeout(this._timer);},i.emit=function(){this.state===Yu&&(this._input.tapCount=this.count,this.manager.emit(this.options.event,this._input));},e}(Gu),Xu=function(t){function e(e){return void 0===e&&(e={}),t.call(this,dd({pointers:1},e))||this}ud(e,t);var i=e.prototype;return i.attrTest=function(t){var e=this.options.pointers;return 0===e||t.pointers.length===e},i.process=function(t){var e=this.state,i=t.eventType,n=e&(Lu|Ru),o=this.attrTest(t);return n&&(i&Rd||!o)?e|Hu:n||o?i&Ld?e|Bu:e&Lu?e|Ru:Lu:32},e}(Gu);function Zu(t){return t===Vd?"down":t===Wd?"up":t===Yd?"left":t===Hd?"right":""}var Ku=function(t){function e(e){var i;return void 0===e&&(e={}),(i=t.call(this,dd({event:"pan",threshold:10,pointers:1,direction:qd},e))||this).pX=null,i.pY=null,i}ud(e,t);var i=e.prototype;return i.getTouchAction=function(){var t=this.options.direction,e=[];return t&Ud&&e.push(Dd),t&Gd&&e.push(Ed),e},i.directionTest=function(t){var e=this.options,i=!0,n=t.distance,o=t.direction,r=t.deltaX,s=t.deltaY;return o&e.direction||(e.direction&Ud?(o=0===r?Bd:r<0?Yd:Hd,i=r!==this.pX,n=Math.abs(t.deltaX)):(o=0===s?Bd:s<0?Wd:Vd,i=s!==this.pY,n=Math.abs(t.deltaY))),t.direction=o,i&&n>e.threshold&&o&e.direction},i.attrTest=function(t){return Xu.prototype.attrTest.call(this,t)&&(this.state&Lu||!(this.state&Lu)&&this.directionTest(t))},i.emit=function(e){this.pX=e.deltaX,this.pY=e.deltaY;var i=Zu(e.direction);i&&(e.additionalEvent=this.options.event+i),t.prototype.emit.call(this,e);},e}(Xu),$u=function(t){function e(e){return void 0===e&&(e={}),t.call(this,dd({event:"swipe",threshold:10,velocity:.3,direction:Ud|Gd,pointers:1},e))||this}ud(e,t);var i=e.prototype;return i.getTouchAction=function(){return Ku.prototype.getTouchAction.call(this)},i.attrTest=function(e){var i,n=this.options.direction;return n&(Ud|Gd)?i=e.overallVelocity:n&Ud?i=e.overallVelocityX:n&Gd&&(i=e.overallVelocityY),t.prototype.attrTest.call(this,e)&&n&e.offsetDirection&&e.distance>this.options.threshold&&e.maxPointers===this.options.pointers&&bd(i)>this.options.velocity&&e.eventType&Ld},i.emit=function(t){var e=Zu(t.offsetDirection);e&&this.manager.emit(this.options.event+e,t),this.manager.emit(this.options.event,t);},e}(Xu),Ju=function(t){function e(e){return void 0===e&&(e={}),t.call(this,dd({event:"pinch",threshold:0,pointers:2},e))||this}ud(e,t);var i=e.prototype;return i.getTouchAction=function(){return [Md]},i.attrTest=function(e){return t.prototype.attrTest.call(this,e)&&(Math.abs(e.scale-1)>this.options.threshold||this.state&Lu)},i.emit=function(e){if(1!==e.scale){var i=e.scale<1?"in":"out";e.additionalEvent=this.options.event+i;}t.prototype.emit.call(this,e);},e}(Xu),Qu=function(t){function e(e){return void 0===e&&(e={}),t.call(this,dd({event:"rotate",threshold:0,pointers:2},e))||this}ud(e,t);var i=e.prototype;return i.getTouchAction=function(){return [Md]},i.attrTest=function(e){return t.prototype.attrTest.call(this,e)&&(Math.abs(e.rotation)>this.options.threshold||this.state&Lu)},e}(Xu),tc=function(t){function e(e){var i;return void 0===e&&(e={}),(i=t.call(this,dd({event:"press",pointers:1,time:251,threshold:9},e))||this)._timer=null,i._input=null,i}ud(e,t);var i=e.prototype;return i.getTouchAction=function(){return [Od]},i.process=function(t){var e=this,i=this.options,n=t.pointers.length===i.pointers,o=t.distance<i.threshold,r=t.deltaTime>i.time;if(this._input=t,!o||!n||t.eventType&(Ld|Rd)&&!r)this.reset();else if(t.eventType&jd)this.reset(),this._timer=setTimeout((function(){e.state=Yu,e.tryEmit();}),i.time);else if(t.eventType&Ld)return Yu;return 32},i.reset=function(){clearTimeout(this._timer);},i.emit=function(t){this.state===Yu&&(t&&t.eventType&Ld?this.manager.emit(this.options.event+"up",t):(this._input.timeStamp=wd(),this.manager.emit(this.options.event,this._input)));},e}(Gu),ec={domEvents:!1,touchAction:"compute",enable:!0,inputTarget:null,inputClass:null,cssProps:{userSelect:"none",touchSelect:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}},ic=[[Qu,{enable:!1}],[Ju,{enable:!1},["rotate"]],[$u,{direction:Ud}],[Ku,{direction:Ud},["swipe"]],[qu],[qu,{event:"doubletap",taps:2},["tap"]],[tc]];function nc(t,e){var i,n=t.element;n.style&&(Kd(t.options.cssProps,(function(o,r){i=_d(n.style,r),e?(t.oldCssProps[i]=n.style[i],n.style[i]=o):n.style[i]=t.oldCssProps[i]||"";})),e||(t.oldCssProps={}));}var oc=function(){function t(t,e){var i,n=this;this.options=pd({},ec,e||{}),this.options.inputTarget=this.options.inputTarget||t,this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=t,this.input=new((i=this).options.inputClass||(Pd?bu:Ad?Ou:Cd?Nu:Tu))(i,hu),this.touchAction=new Qd(this,this.options.touchAction),nc(this,!0),Kd(this.options.recognizers,(function(t){var e=n.add(new t[0](t[1]));t[2]&&e.recognizeWith(t[2]),t[3]&&e.requireFailure(t[3]);}),this);}var e=t.prototype;return e.set=function(t){return pd(this.options,t),t.touchAction&&this.touchAction.update(),t.inputTarget&&(this.input.destroy(),this.input.target=t.inputTarget,this.input.init()),this},e.stop=function(t){this.session.stopped=t?2:1;},e.recognize=function(t){var e=this.session;if(!e.stopped){var i;this.touchAction.preventDefaults(t);var n=this.recognizers,o=e.curRecognizer;(!o||o&&o.state&Yu)&&(e.curRecognizer=null,o=null);for(var r=0;r<n.length;)i=n[r],2===e.stopped||o&&i!==o&&!i.canRecognizeWith(o)?i.reset():i.recognize(t),!o&&i.state&(Lu|Ru|Bu)&&(e.curRecognizer=i,o=i),r++;}},e.get=function(t){if(t instanceof Gu)return t;for(var e=this.recognizers,i=0;i<e.length;i++)if(e[i].options.event===t)return e[i];return null},e.add=function(t){if(ju(t,"add",this))return this;var e=this.get(t.options.event);return e&&this.remove(e),this.recognizers.push(t),t.manager=this,this.touchAction.update(),t},e.remove=function(t){if(ju(t,"remove",this))return this;var e=this.get(t);if(t){var i=this.recognizers,n=pu(i,e);-1!==n&&(i.splice(n,1),this.touchAction.update());}return this},e.on=function(t,e){if(void 0===t||void 0===e)return this;var i=this.handlers;return Kd(lu(t),(function(t){i[t]=i[t]||[],i[t].push(e);})),this},e.off=function(t,e){if(void 0===t)return this;var i=this.handlers;return Kd(lu(t),(function(t){e?i[t]&&i[t].splice(pu(i[t],e),1):delete i[t];})),this},e.emit=function(t,e){this.options.domEvents&&function(t,e){var i=document.createEvent("Event");i.initEvent(t,!0,!0),i.gesture=e,e.target.dispatchEvent(i);}(t,e);var i=this.handlers[t]&&this.handlers[t].slice();if(i&&i.length){e.type=t,e.preventDefault=function(){e.srcEvent.preventDefault();};for(var n=0;n<i.length;)i[n](e),n++;}},e.destroy=function(){this.element&&nc(this,!1),this.handlers={},this.session={},this.input.destroy(),this.element=null;},t}(),rc={touchstart:jd,touchmove:zd,touchend:Ld,touchcancel:Rd},sc="touchstart",ac="touchstart touchmove touchend touchcancel",hc=function(t){function e(){var i,n=e.prototype;return n.evTarget=sc,n.evWin=ac,(i=t.apply(this,arguments)||this).started=!1,i}return ud(e,t),e.prototype.handler=function(t){var e=rc[t.type];if(e===jd&&(this.started=!0),this.started){var i=lc.call(this,t,e);e&(Ld|Rd)&&i[0].length-i[1].length==0&&(this.started=!1),this.callback(this.manager,e,{pointers:i[0],changedPointers:i[1],pointerType:Id,srcEvent:t});}},e}(fu);function lc(t,e){var i=wu(t.touches),n=wu(t.changedTouches);return e&(Ld|Rd)&&(i=_u(i.concat(n),"identifier",!0)),[i,n]}function dc(t,e,i){var n="DEPRECATED METHOD: "+e+"\n"+i+" AT \n";return function(){var e=new Error("get-stack-trace"),i=e&&e.stack?e.stack.replace(/^[^\(]+?[\n$]/gm,"").replace(/^\s+at\s+/gm,"").replace(/^Object.<anonymous>\s*\(/gm,"{anonymous}()@"):"Unknown Stack Trace",o=window.console&&(window.console.warn||window.console.log);return o&&o.call(window.console,n,i),t.apply(this,arguments)}}var uc=dc((function(t,e,i){for(var n=Object.keys(e),o=0;o<n.length;)(!i||i&&void 0===t[n[o]])&&(t[n[o]]=e[n[o]]),o++;return t}),"extend","Use `assign`."),cc=dc((function(t,e){return uc(t,e,!0)}),"merge","Use `assign`.");function fc(t,e,i){var n,o=e.prototype;(n=t.prototype=Object.create(o)).constructor=t,n._super=o,i&&pd(n,i);}function pc(t,e){return function(){return t.apply(e,arguments)}}var vc,yc=function(){var t=function(t,e){return void 0===e&&(e={}),new oc(t,dd({recognizers:ic.concat()},e))};return t.VERSION="2.0.17-rc",t.DIRECTION_ALL=qd,t.DIRECTION_DOWN=Vd,t.DIRECTION_LEFT=Yd,t.DIRECTION_RIGHT=Hd,t.DIRECTION_UP=Wd,t.DIRECTION_HORIZONTAL=Ud,t.DIRECTION_VERTICAL=Gd,t.DIRECTION_NONE=Bd,t.DIRECTION_DOWN=Vd,t.INPUT_START=jd,t.INPUT_MOVE=zd,t.INPUT_END=Ld,t.INPUT_CANCEL=Rd,t.STATE_POSSIBLE=zu,t.STATE_BEGAN=Lu,t.STATE_CHANGED=Ru,t.STATE_ENDED=Bu,t.STATE_RECOGNIZED=Yu,t.STATE_CANCELLED=Hu,t.STATE_FAILED=32,t.Manager=oc,t.Input=fu,t.TouchAction=Qd,t.TouchInput=Ou,t.MouseInput=Tu,t.PointerEventInput=bu,t.TouchMouseInput=Nu,t.SingleTouchInput=hc,t.Recognizer=Gu,t.AttrRecognizer=Xu,t.Tap=qu,t.Pan=Ku,t.Swipe=$u,t.Pinch=Ju,t.Rotate=Qu,t.Press=tc,t.on=du,t.off=uu,t.each=Kd,t.merge=cc,t.extend=uc,t.bindFn=pc,t.assign=pd,t.inherit=fc,t.bindFn=pc,t.prefixed=_d,t.toArray=wu,t.inArray=pu,t.uniqueArray=_u,t.splitStr=lu,t.boolOrFn=$d,t.hasParent=tu,t.addEventListeners=du,t.removeEventListeners=uu,t.defaults=pd({},ec,{preset:ic}),t}(),gc=i((function(t){if("undefined"!=typeof window){var e=window.Hammer||yc;t.exports=e;}else t.exports=function(){return {on:t=function(){},off:t,destroy:t,emit:t,get:function(e){return {set:t}}};var t;};})),mc=Object.freeze({__proto__:null,default:gc,__moduleExports:gc});function bc(t){var e,i,n=this;this.active=!1,this.dom={container:t},this.dom.overlay=document.createElement("div"),this.dom.overlay.className="vis-overlay",this.dom.container.appendChild(this.dom.overlay),this.hammer=gc(this.dom.overlay),this.hammer.on("tap",$(e=this._onTapOverlay).call(e,this));var o=["tap","doubletap","press","pinch","pan","panstart","panmove","panend"];zh(o).call(o,(function(t){n.hammer.on(t,(function(t){t.srcEvent.stopPropagation();}));})),document&&document.body&&(this.onClick=function(e){(function(t,e){for(;t;){if(t===e)return !0;t=t.parentNode;}return !1})(e.target,t)||n.deactivate();},document.body.addEventListener("click",this.onClick)),void 0!==this.keycharm&&this.keycharm.destroy(),this.keycharm=hd(),this.escListener=$(i=this.deactivate).call(i,this);}(vc=ad)&&vc.default,ot(bc.prototype),bc.current=null,bc.prototype.destroy=function(){this.deactivate(),this.dom.overlay.parentNode.removeChild(this.dom.overlay),this.onClick&&document.body.removeEventListener("click",this.onClick),void 0!==this.keycharm&&this.keycharm.destroy(),this.keycharm=null,this.hammer.destroy(),this.hammer=null;},bc.prototype.activate=function(){var t;bc.current&&bc.current.deactivate(),bc.current=this,this.active=!0,this.dom.overlay.style.display="none",Vs.addClassName(this.dom.container,"vis-active"),this.emit("change"),this.emit("activate"),$(t=this.keycharm).call(t,"esc",this.escListener);},bc.prototype.deactivate=function(){this.active=!1,this.dom.overlay.style.display="block",Vs.removeClassName(this.dom.container,"vis-active"),this.keycharm.unbind("esc",this.escListener),this.emit("change"),this.emit("deactivate");},bc.prototype._onTapOverlay=function(t){this.activate(),t.srcEvent.stopPropagation();};var wc=bc,_c=i((function(t,e){e.en={edit:"Edit",del:"Delete selected",back:"Back",addNode:"Add Node",addEdge:"Add Edge",editNode:"Edit Node",editEdge:"Edit Edge",addDescription:"Click in an empty space to place a new node.",edgeDescription:"Click on a node and drag the edge to another node to connect them.",editEdgeDescription:"Click on the control points and drag them to a node to connect to it.",createEdgeError:"Cannot link edges to a cluster.",deleteClusterError:"Clusters cannot be deleted.",editClusterError:"Clusters cannot be edited."},e.en_EN=e.en,e.en_US=e.en,e.de={edit:"Editieren",del:"Lösche Auswahl",back:"Zurück",addNode:"Knoten hinzufügen",addEdge:"Kante hinzufügen",editNode:"Knoten editieren",editEdge:"Kante editieren",addDescription:"Klicke auf eine freie Stelle, um einen neuen Knoten zu plazieren.",edgeDescription:"Klicke auf einen Knoten und ziehe die Kante zu einem anderen Knoten, um diese zu verbinden.",editEdgeDescription:"Klicke auf die Verbindungspunkte und ziehe diese auf einen Knoten, um sie zu verbinden.",createEdgeError:"Es ist nicht möglich, Kanten mit Clustern zu verbinden.",deleteClusterError:"Cluster können nicht gelöscht werden.",editClusterError:"Cluster können nicht editiert werden."},e.de_DE=e.de,e.es={edit:"Editar",del:"Eliminar selección",back:"Atrás",addNode:"Añadir nodo",addEdge:"Añadir arista",editNode:"Editar nodo",editEdge:"Editar arista",addDescription:"Haga clic en un lugar vacío para colocar un nuevo nodo.",edgeDescription:"Haga clic en un nodo y arrastre la arista hacia otro nodo para conectarlos.",editEdgeDescription:"Haga clic en un punto de control y arrastrelo a un nodo para conectarlo.",createEdgeError:"No se puede conectar una arista a un grupo.",deleteClusterError:"No es posible eliminar grupos.",editClusterError:"No es posible editar grupos."},e.es_ES=e.es,e.it={edit:"Modifica",del:"Cancella la selezione",back:"Indietro",addNode:"Aggiungi un nodo",addEdge:"Aggiungi un vertice",editNode:"Modifica il nodo",editEdge:"Modifica il vertice",addDescription:"Clicca per aggiungere un nuovo nodo",edgeDescription:"Clicca su un nodo e trascinalo ad un altro nodo per connetterli.",editEdgeDescription:"Clicca sui Punti di controllo e trascinali ad un nodo per connetterli.",createEdgeError:"Non si possono collegare vertici ad un cluster",deleteClusterError:"I cluster non possono essere cancellati",editClusterError:"I clusters non possono essere modificati."},e.it_IT=e.it,e.nl={edit:"Wijzigen",del:"Selectie verwijderen",back:"Terug",addNode:"Node toevoegen",addEdge:"Link toevoegen",editNode:"Node wijzigen",editEdge:"Link wijzigen",addDescription:"Klik op een leeg gebied om een nieuwe node te maken.",edgeDescription:"Klik op een node en sleep de link naar een andere node om ze te verbinden.",editEdgeDescription:"Klik op de verbindingspunten en sleep ze naar een node om daarmee te verbinden.",createEdgeError:"Kan geen link maken naar een cluster.",deleteClusterError:"Clusters kunnen niet worden verwijderd.",editClusterError:"Clusters kunnen niet worden aangepast."},e.nl_NL=e.nl,e.nl_BE=e.nl,e["pt-br"]={edit:"Editar",del:"Remover selecionado",back:"Voltar",addNode:"Adicionar nó",addEdge:"Adicionar aresta",editNode:"Editar nó",editEdge:"Editar aresta",addDescription:"Clique em um espaço em branco para adicionar um novo nó",edgeDescription:"Clique em um nó e arraste a aresta até outro nó para conectá-los",editEdgeDescription:"Clique nos pontos de controle e os arraste para um nó para conectá-los",createEdgeError:"Não foi possível linkar arestas a um cluster.",deleteClusterError:"Clusters não puderam ser removidos.",editClusterError:"Clusters não puderam ser editados."},e["pt-BR"]=e["pt-br"],e.pt_BR=e["pt-br"],e.pt_br=e["pt-br"],e.ru={edit:"Редактировать",del:"Удалить выбранное",back:"Назад",addNode:"Добавить узел",addEdge:"Добавить ребро",editNode:"Редактировать узел",editEdge:"Редактировать ребро",addDescription:"Кликните в свободное место, чтобы добавить новый узел.",edgeDescription:"Кликните на узел и протяните ребро к другому узлу, чтобы соединить их.",editEdgeDescription:"Кликните на контрольные точки и перетащите их в узел, чтобы подключиться к нему.",createEdgeError:"Невозможно соединить ребра в кластер.",deleteClusterError:"Кластеры не могут быть удалены",editClusterError:"Кластеры недоступны для редактирования."},e.ru_RU=e.ru,e.cn={edit:"编辑",del:"删除选定",back:"返回",addNode:"添加节点",addEdge:"添加连接线",editNode:"编辑节点",editEdge:"编辑连接线",addDescription:"单击空白处放置新节点。",edgeDescription:"单击某个节点并将该连接线拖动到另一个节点以连接它们。",editEdgeDescription:"单击控制节点并将它们拖到节点上连接。",createEdgeError:"无法将连接线连接到群集。",deleteClusterError:"无法删除群集。",editClusterError:"无法编辑群集。"},e.zh_CN=e.cn,e.uk={edit:"Редагувати",del:"Видалити обране",back:"Назад",addNode:"Додати вузол",addEdge:"Додати край",editNode:"Редагувати вузол",editEdge:"Редагувати край",addDescription:"Kлікніть на вільне місце, щоб додати новий вузол.",edgeDescription:"Клікніть на вузол і перетягніть край до іншого вузла, щоб їх з'єднати.",editEdgeDescription:"Клікніть на контрольні точки і перетягніть їх у вузол, щоб підключитися до нього.",createEdgeError:"Не можливо об'єднати краї в групу.",deleteClusterError:"Групи не можуть бути видалені.",editClusterError:"Групи недоступні для редагування."},e.uk_UA=e.uk,e.fr={edit:"Editer",del:"Effacer la selection",back:"Retour",addNode:"Ajouter un noeud",addEdge:"Ajouter un lien",editNode:"Editer le noeud",editEdge:"Editer le lien",addDescription:"Cliquez dans un endroit vide pour placer un noeud.",edgeDescription:"Cliquez sur un noeud et glissez le lien vers un autre noeud pour les connecter.",editEdgeDescription:"Cliquez sur les points de contrôle et glissez-les pour connecter un noeud.",createEdgeError:"Impossible de créer un lien vers un cluster.",deleteClusterError:"Les clusters ne peuvent pas être éffacés.",editClusterError:"Les clusters ne peuvent pas être édites."},e.fr_FR=e.fr,e.cs={edit:"Upravit",del:"Smazat výběr",back:"Zpět",addNode:"Přidat vrchol",addEdge:"Přidat hranu",editNode:"Upravit vrchol",editEdge:"Upravit hranu",addDescription:"Kluknutím do prázdného prostoru můžete přidat nový vrchol.",edgeDescription:"Přetažením z jednoho vrcholu do druhého můžete spojit tyto vrcholy novou hranou.",editEdgeDescription:"Přetažením kontrolního vrcholu hrany ji můžete připojit k jinému vrcholu.",createEdgeError:"Nelze připojit hranu ke shluku.",deleteClusterError:"Nelze mazat shluky.",editClusterError:"Nelze upravovat shluky."},e.cs_CZ=e.cs;}));var kc=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")};W({target:"Object",stat:!0,forced:!s,sham:!s},{defineProperty:R.f});var xc=i((function(t){var e=F.Object,i=t.exports=function(t,i,n){return e.defineProperty(t,i,n)};e.defineProperty.sham&&(i.sham=!0);})),Oc=xc;function Sc(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Oc(t,n.key,n);}}var Mc=function(t,e,i){return e&&Sc(t.prototype,e),i&&Sc(t,i),t},Ec=function(){function t(){kc(this,t),this.NUM_ITERATIONS=4,this.image=new Image,this.canvas=document.createElement("canvas");}return Mc(t,[{key:"init",value:function(){if(!this.initialized()){this.src=this.image.src;var t=this.image.width,e=this.image.height;this.width=t,this.height=e;var i=Math.floor(e/2),n=Math.floor(e/4),o=Math.floor(e/8),r=Math.floor(e/16),s=Math.floor(t/2),a=Math.floor(t/4),h=Math.floor(t/8),l=Math.floor(t/16);this.canvas.width=3*a,this.canvas.height=i,this.coordinates=[[0,0,s,i],[s,0,a,n],[s,n,h,o],[5*h,n,l,r]],this._fillMipMap();}}},{key:"initialized",value:function(){return void 0!==this.coordinates}},{key:"_fillMipMap",value:function(){var t=this.canvas.getContext("2d"),e=this.coordinates[0];t.drawImage(this.image,e[0],e[1],e[2],e[3]);for(var i=1;i<this.NUM_ITERATIONS;i++){var n=this.coordinates[i-1],o=this.coordinates[i];t.drawImage(this.canvas,n[0],n[1],n[2],n[3],o[0],o[1],o[2],o[3]);}}},{key:"drawImageAtPosition",value:function(t,e,i,n,o,r){if(this.initialized())if(e>2){e*=.5;for(var s=0;e>2&&s<this.NUM_ITERATIONS;)e*=.5,s+=1;s>=this.NUM_ITERATIONS&&(s=this.NUM_ITERATIONS-1);var a=this.coordinates[s];t.drawImage(this.canvas,a[0],a[1],a[2],a[3],i,n,o,r);}else t.drawImage(this.image,i,n,o,r);}}]),t}(),Dc=function(){function t(e){kc(this,t),this.images={},this.imageBroken={},this.callback=e;}return Mc(t,[{key:"_tryloadBrokenUrl",value:function(t,e,i){void 0!==t&&void 0!==i&&(void 0!==e?(i.image.onerror=function(){console.error("Could not load brokenImage:",e);},i.image.src=e):console.warn("No broken url image defined"));}},{key:"_redrawWithImage",value:function(t){this.callback&&this.callback(t);}},{key:"load",value:function(t,e){var i=this,n=this.images[t];if(n)return n;var o=new Ec;return this.images[t]=o,o.image.onload=function(){i._fixImageCoordinates(o.image),o.init(),i._redrawWithImage(o);},o.image.onerror=function(){console.error("Could not load image:",t),i._tryloadBrokenUrl(t,e,o);},o.image.src=t,o}},{key:"_fixImageCoordinates",value:function(t){0===t.width&&(document.body.appendChild(t),t.width=t.offsetWidth,t.height=t.offsetHeight,document.body.removeChild(t));}}]),t}(),Tc=function(){function t(){kc(this,t),this.clear(),this.defaultIndex=0,this.groupsArray=[],this.groupIndex=0,this.defaultGroups=[{border:"#2B7CE9",background:"#97C2FC",highlight:{border:"#2B7CE9",background:"#D2E5FF"},hover:{border:"#2B7CE9",background:"#D2E5FF"}},{border:"#FFA500",background:"#FFFF00",highlight:{border:"#FFA500",background:"#FFFFA3"},hover:{border:"#FFA500",background:"#FFFFA3"}},{border:"#FA0A10",background:"#FB7E81",highlight:{border:"#FA0A10",background:"#FFAFB1"},hover:{border:"#FA0A10",background:"#FFAFB1"}},{border:"#41A906",background:"#7BE141",highlight:{border:"#41A906",background:"#A1EC76"},hover:{border:"#41A906",background:"#A1EC76"}},{border:"#E129F0",background:"#EB7DF4",highlight:{border:"#E129F0",background:"#F0B3F5"},hover:{border:"#E129F0",background:"#F0B3F5"}},{border:"#7C29F0",background:"#AD85E4",highlight:{border:"#7C29F0",background:"#D3BDF0"},hover:{border:"#7C29F0",background:"#D3BDF0"}},{border:"#C37F00",background:"#FFA807",highlight:{border:"#C37F00",background:"#FFCA66"},hover:{border:"#C37F00",background:"#FFCA66"}},{border:"#4220FB",background:"#6E6EFD",highlight:{border:"#4220FB",background:"#9B9BFD"},hover:{border:"#4220FB",background:"#9B9BFD"}},{border:"#FD5A77",background:"#FFC0CB",highlight:{border:"#FD5A77",background:"#FFD1D9"},hover:{border:"#FD5A77",background:"#FFD1D9"}},{border:"#4AD63A",background:"#C2FABC",highlight:{border:"#4AD63A",background:"#E6FFE3"},hover:{border:"#4AD63A",background:"#E6FFE3"}},{border:"#990000",background:"#EE0000",highlight:{border:"#BB0000",background:"#FF3333"},hover:{border:"#BB0000",background:"#FF3333"}},{border:"#FF6000",background:"#FF6000",highlight:{border:"#FF6000",background:"#FF6000"},hover:{border:"#FF6000",background:"#FF6000"}},{border:"#97C2FC",background:"#2B7CE9",highlight:{border:"#D2E5FF",background:"#2B7CE9"},hover:{border:"#D2E5FF",background:"#2B7CE9"}},{border:"#399605",background:"#255C03",highlight:{border:"#399605",background:"#255C03"},hover:{border:"#399605",background:"#255C03"}},{border:"#B70054",background:"#FF007E",highlight:{border:"#B70054",background:"#FF007E"},hover:{border:"#B70054",background:"#FF007E"}},{border:"#AD85E4",background:"#7C29F0",highlight:{border:"#D3BDF0",background:"#7C29F0"},hover:{border:"#D3BDF0",background:"#7C29F0"}},{border:"#4557FA",background:"#000EA1",highlight:{border:"#6E6EFD",background:"#000EA1"},hover:{border:"#6E6EFD",background:"#000EA1"}},{border:"#FFC0CB",background:"#FD5A77",highlight:{border:"#FFD1D9",background:"#FD5A77"},hover:{border:"#FFD1D9",background:"#FD5A77"}},{border:"#C2FABC",background:"#74D66A",highlight:{border:"#E6FFE3",background:"#74D66A"},hover:{border:"#E6FFE3",background:"#74D66A"}},{border:"#EE0000",background:"#990000",highlight:{border:"#FF3333",background:"#BB0000"},hover:{border:"#FF3333",background:"#BB0000"}}],this.options={},this.defaultOptions={useDefaultGroups:!0},$r(this.options,this.defaultOptions);}return Mc(t,[{key:"setOptions",value:function(t){var e=["useDefaultGroups"];if(void 0!==t)for(var i in t)if(t.hasOwnProperty(i)&&-1===yl(e).call(e,i)){var n=t[i];this.add(i,n);}}},{key:"clear",value:function(){this.groups={},this.groupsArray=[];}},{key:"get",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=this.groups[t];if(void 0===i&&e)if(!1===this.options.useDefaultGroups&&this.groupsArray.length>0){var n=this.groupIndex%this.groupsArray.length;this.groupIndex++,(i={}).color=this.groups[this.groupsArray[n]],this.groups[t]=i;}else{var o=this.defaultIndex%this.defaultGroups.length;this.defaultIndex++,(i={}).color=this.defaultGroups[o],this.groups[t]=i;}return i}},{key:"add",value:function(t,e){return this.groups[t]=e,this.groupsArray.push(t),e}}]),t}(),Cc=[].slice,Pc=/MSIE .\./.test(Wh),Ac=function(t){return function(e,i){var n=arguments.length>2,o=n?Cc.call(arguments,2):void 0;return t(n?function(){("function"==typeof e?e:Function(e)).apply(this,o);}:e,i)}};W({global:!0,bind:!0,forced:Pc},{setTimeout:Ac(o.setTimeout),setInterval:Ac(o.setInterval)});var Ic=F.setTimeout,Fc=function(t){return function(e,i){var n,o,r=String(v(e)),s=Fa(i),a=r.length;return s<0||s>=a?t?"":void 0:(n=r.charCodeAt(s))<55296||n>56319||s+1===a||(o=r.charCodeAt(s+1))<56320||o>57343?t?r.charAt(s):n:t?r.slice(s,s+2):o-56320+(n-55296<<10)+65536}},Nc={codeAt:Fc(!1),charAt:Fc(!0)}.charAt,jc=ga.set,zc=ga.getterFor("String Iterator");mh(String,"String",(function(t){jc(this,{type:"String Iterator",string:String(t),index:0});}),(function(){var t,e=zc(this),i=e.string,n=e.index;return n>=i.length?{value:void 0,done:!0}:(t=Nc(i,n),e.index+=t.length,{value:t,done:!1})}));var Lc=Da("iterator"),Rc=function(t){if(null!=t)return t[Lc]||t["@@iterator"]||Gs[rh(t)]},Bc=function(t){var e=Rc(t);if("function"!=typeof e)throw TypeError(String(t)+" is not iterable");return z(e.call(t))},Yc=Ch.some;W({target:"Array",proto:!0,forced:Ph("some")},{some:function(t){return Yc(this,t,arguments.length>1?arguments[1]:void 0)}});var Hc=X("Array").some,Wc=Array.prototype,Vc=function(t){var e=t.some;return t===Wc||t instanceof Array&&e===Wc.some?Hc:e},Uc="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function Gc(){throw new Error("Dynamic requires are not currently supported by rollup-plugin-commonjs")}function qc(t,e){return t(e={exports:{}},e.exports),e.exports}var Xc=function(t){return t&&t.Math==Math&&t},Zc=Xc("object"==typeof globalThis&&globalThis)||Xc("object"==typeof window&&window)||Xc("object"==typeof self&&self)||Xc("object"==typeof Uc&&Uc)||Function("return this")(),Kc=function(t){try{return !!t()}catch(t){return !0}},$c=!Kc((function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a})),Jc={}.propertyIsEnumerable,Qc=Object.getOwnPropertyDescriptor,tf={f:Qc&&!Jc.call({1:2},1)?function(t){var e=Qc(this,t);return !!e&&e.enumerable}:Jc},ef=function(t,e){return {enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}},nf={}.toString,of=function(t){return nf.call(t).slice(8,-1)},rf="".split,sf=Kc((function(){return !Object("z").propertyIsEnumerable(0)}))?function(t){return "String"==of(t)?rf.call(t,""):Object(t)}:Object,af=function(t){if(null==t)throw TypeError("Can't call method on "+t);return t},hf=function(t){return sf(af(t))},lf=function(t){return "object"==typeof t?null!==t:"function"==typeof t},df=function(t,e){if(!lf(t))return t;var i,n;if(e&&"function"==typeof(i=t.toString)&&!lf(n=i.call(t)))return n;if("function"==typeof(i=t.valueOf)&&!lf(n=i.call(t)))return n;if(!e&&"function"==typeof(i=t.toString)&&!lf(n=i.call(t)))return n;throw TypeError("Can't convert object to primitive value")},uf={}.hasOwnProperty,cf=function(t,e){return uf.call(t,e)},ff=Zc.document,pf=lf(ff)&&lf(ff.createElement),vf=function(t){return pf?ff.createElement(t):{}},yf=!$c&&!Kc((function(){return 7!=Object.defineProperty(vf("div"),"a",{get:function(){return 7}}).a})),gf=Object.getOwnPropertyDescriptor,mf={f:$c?gf:function(t,e){if(t=hf(t),e=df(e,!0),yf)try{return gf(t,e)}catch(t){}if(cf(t,e))return ef(!tf.f.call(t,e),t[e])}},bf=/#|\.prototype\./,wf=function(t,e){var i=kf[_f(t)];return i==Of||i!=xf&&("function"==typeof e?Kc(e):!!e)},_f=wf.normalize=function(t){return String(t).replace(bf,".").toLowerCase()},kf=wf.data={},xf=wf.NATIVE="N",Of=wf.POLYFILL="P",Sf=wf,Mf={},Ef=function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function");return t},Df=function(t,e,i){if(Ef(t),void 0===e)return t;switch(i){case 0:return function(){return t.call(e)};case 1:return function(i){return t.call(e,i)};case 2:return function(i,n){return t.call(e,i,n)};case 3:return function(i,n,o){return t.call(e,i,n,o)}}return function(){return t.apply(e,arguments)}},Tf=function(t){if(!lf(t))throw TypeError(String(t)+" is not an object");return t},Cf=Object.defineProperty,Pf={f:$c?Cf:function(t,e,i){if(Tf(t),e=df(e,!0),Tf(i),yf)try{return Cf(t,e,i)}catch(t){}if("get"in i||"set"in i)throw TypeError("Accessors not supported");return "value"in i&&(t[e]=i.value),t}},Af=$c?function(t,e,i){return Pf.f(t,e,ef(1,i))}:function(t,e,i){return t[e]=i,t},If=mf.f,Ff=function(t){var e=function(e,i,n){if(this instanceof t){switch(arguments.length){case 0:return new t;case 1:return new t(e);case 2:return new t(e,i)}return new t(e,i,n)}return t.apply(this,arguments)};return e.prototype=t.prototype,e},Nf=function(t,e){var i,n,o,r,s,a,h,l,d=t.target,u=t.global,c=t.stat,f=t.proto,p=u?Zc:c?Zc[d]:(Zc[d]||{}).prototype,v=u?Mf:Mf[d]||(Mf[d]={}),y=v.prototype;for(o in e)i=!Sf(u?o:d+(c?".":"#")+o,t.forced)&&p&&cf(p,o),s=v[o],i&&(a=t.noTargetGet?(l=If(p,o))&&l.value:p[o]),r=i&&a?a:e[o],i&&typeof s==typeof r||(h=t.bind&&i?Df(r,Zc):t.wrap&&i?Ff(r):f&&"function"==typeof r?Df(Function.call,r):r,(t.sham||r&&r.sham||s&&s.sham)&&Af(h,"sham",!0),v[o]=h,f&&(cf(Mf,n=d+"Prototype")||Af(Mf,n,{}),Mf[n][o]=r,t.real&&y&&!y[o]&&Af(y,o,r)));};Nf({target:"Object",stat:!0,forced:!$c,sham:!$c},{defineProperty:Pf.f});var jf=qc((function(t){var e=Mf.Object,i=t.exports=function(t,i,n){return e.defineProperty(t,i,n)};e.defineProperty.sham&&(i.sham=!0);})),zf=jf,Lf=Math.ceil,Rf=Math.floor,Bf=function(t){return isNaN(t=+t)?0:(t>0?Rf:Lf)(t)},Yf=Math.min,Hf=function(t){return t>0?Yf(Bf(t),9007199254740991):0},Wf=Math.max,Vf=Math.min,Uf=function(t,e){var i=Bf(t);return i<0?Wf(i+e,0):Vf(i,e)},Gf=function(t){return function(e,i,n){var o,r=hf(e),s=Hf(r.length),a=Uf(n,s);if(t&&i!=i){for(;s>a;)if((o=r[a++])!=o)return !0}else for(;s>a;a++)if((t||a in r)&&r[a]===i)return t||a||0;return !t&&-1}},qf={includes:Gf(!0),indexOf:Gf(!1)},Xf={},Zf=qf.indexOf,Kf=function(t,e){var i,n=hf(t),o=0,r=[];for(i in n)!cf(Xf,i)&&cf(n,i)&&r.push(i);for(;e.length>o;)cf(n,i=e[o++])&&(~Zf(r,i)||r.push(i));return r},$f=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],Jf=Object.keys||function(t){return Kf(t,$f)},Qf=$c?Object.defineProperties:function(t,e){Tf(t);for(var i,n=Jf(e),o=n.length,r=0;o>r;)Pf.f(t,i=n[r++],e[i]);return t};Nf({target:"Object",stat:!0,forced:!$c,sham:!$c},{defineProperties:Qf});var tp=qc((function(t){var e=Mf.Object,i=t.exports=function(t,i){return e.defineProperties(t,i)};e.defineProperties.sham&&(i.sham=!0);})),ep=function(t){return "function"==typeof t?t:void 0},ip=function(t,e){return arguments.length<2?ep(Mf[t])||ep(Zc[t]):Mf[t]&&Mf[t][e]||Zc[t]&&Zc[t][e]},np=$f.concat("length","prototype"),op={f:Object.getOwnPropertyNames||function(t){return Kf(t,np)}},rp={f:Object.getOwnPropertySymbols},sp=ip("Reflect","ownKeys")||function(t){var e=op.f(Tf(t)),i=rp.f;return i?e.concat(i(t)):e},ap=function(t,e,i){var n=df(e);n in t?Pf.f(t,n,ef(0,i)):t[n]=i;};Nf({target:"Object",stat:!0,sham:!$c},{getOwnPropertyDescriptors:function(t){for(var e,i,n=hf(t),o=mf.f,r=sp(n),s={},a=0;r.length>a;)void 0!==(i=o(n,e=r[a++]))&&ap(s,e,i);return s}});var hp,lp,dp,up=Mf.Object.getOwnPropertyDescriptors,cp={},fp=Zc["__core-js_shared__"]||function(t,e){try{Af(Zc,t,e);}catch(i){Zc[t]=e;}return e}("__core-js_shared__",{}),pp=qc((function(t){(t.exports=function(t,e){return fp[t]||(fp[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.4.5",mode:"pure",copyright:"© 2019 Denis Pushkarev (zloirock.ru)"});})),vp=Function.toString,yp=pp("inspectSource",(function(t){return vp.call(t)})),gp=Zc.WeakMap,mp="function"==typeof gp&&/native code/.test(yp(gp)),bp=0,wp=Math.random(),_p=function(t){return "Symbol("+String(void 0===t?"":t)+")_"+(++bp+wp).toString(36)},kp=pp("keys"),xp=function(t){return kp[t]||(kp[t]=_p(t))},Op=Zc.WeakMap;if(mp){var Sp=new Op,Mp=Sp.get,Ep=Sp.has,Dp=Sp.set;hp=function(t,e){return Dp.call(Sp,t,e),e},lp=function(t){return Mp.call(Sp,t)||{}},dp=function(t){return Ep.call(Sp,t)};}else{var Tp=xp("state");Xf[Tp]=!0,hp=function(t,e){return Af(t,Tp,e),e},lp=function(t){return cf(t,Tp)?t[Tp]:{}},dp=function(t){return cf(t,Tp)};}var Cp,Pp,Ap,Ip={set:hp,get:lp,has:dp,enforce:function(t){return dp(t)?lp(t):hp(t,{})},getterFor:function(t){return function(e){var i;if(!lf(e)||(i=lp(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return i}}},Fp=function(t){return Object(af(t))},Np=!Kc((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype})),jp=xp("IE_PROTO"),zp=Object.prototype,Lp=Np?Object.getPrototypeOf:function(t){return t=Fp(t),cf(t,jp)?t[jp]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?zp:null},Rp=!!Object.getOwnPropertySymbols&&!Kc((function(){return !String(Symbol())})),Bp=Rp&&!Symbol.sham&&"symbol"==typeof Symbol(),Yp=pp("wks"),Hp=Zc.Symbol,Wp=Bp?Hp:_p,Vp=function(t){return cf(Yp,t)||(Rp&&cf(Hp,t)?Yp[t]=Hp[t]:Yp[t]=Wp("Symbol."+t)),Yp[t]},Up=(Vp("iterator"),!1);[].keys&&("next"in(Ap=[].keys())?(Pp=Lp(Lp(Ap)))!==Object.prototype&&(Cp=Pp):Up=!0),null==Cp&&(Cp={});var Gp={IteratorPrototype:Cp,BUGGY_SAFARI_ITERATORS:Up},qp=ip("document","documentElement"),Xp=xp("IE_PROTO"),Zp=function(){},Kp=function(){var t,e=vf("iframe"),i=$f.length;for(e.style.display="none",qp.appendChild(e),e.src=String("javascript:"),(t=e.contentWindow.document).open(),t.write("<script>document.F=Object<\/script>"),t.close(),Kp=t.F;i--;)delete Kp.prototype[$f[i]];return Kp()},$p=Object.create||function(t,e){var i;return null!==t?(Zp.prototype=Tf(t),i=new Zp,Zp.prototype=null,i[Xp]=t):i=Kp(),void 0===e?i:Qf(i,e)};Xf[Xp]=!0;var Jp={};Jp[Vp("toStringTag")]="z";var Qp="[object z]"===String(Jp),tv=Vp("toStringTag"),ev="Arguments"==of(function(){return arguments}()),iv=Qp?of:function(t){var e,i,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(i=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),tv))?i:ev?of(e):"Object"==(n=of(e))&&"function"==typeof e.callee?"Arguments":n},nv=Qp?{}.toString:function(){return "[object "+iv(this)+"]"},ov=Pf.f,rv=Vp("toStringTag"),sv=function(t,e,i,n){if(t){var o=i?t:t.prototype;cf(o,rv)||ov(o,rv,{configurable:!0,value:e}),n&&!Qp&&Af(o,"toString",nv);}},av=Gp.IteratorPrototype,hv=function(){return this},lv=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,i={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(i,[]),e=i instanceof Array;}catch(t){}return function(i,n){return Tf(i),function(t){if(!lf(t)&&null!==t)throw TypeError("Can't set "+String(t)+" as a prototype")}(n),e?t.call(i,n):i.__proto__=n,i}}():void 0),dv=function(t,e,i,n){n&&n.enumerable?t[e]=i:Af(t,e,i);},uv=Gp.IteratorPrototype,cv=Gp.BUGGY_SAFARI_ITERATORS,fv=Vp("iterator"),pv=function(){return this},vv=function(t,e,i,n,o,r,s){!function(t,e,i){var n=e+" Iterator";t.prototype=$p(av,{next:ef(1,i)}),sv(t,n,!1,!0),cp[n]=hv;}(i,e,n);var a,h,l,d=function(t){if(t===o&&v)return v;if(!cv&&t in f)return f[t];switch(t){case"keys":case"values":case"entries":return function(){return new i(this,t)}}return function(){return new i(this)}},u=e+" Iterator",c=!1,f=t.prototype,p=f[fv]||f["@@iterator"]||o&&f[o],v=!cv&&p||d(o),y="Array"==e&&f.entries||p;if(y&&(a=Lp(y.call(new t)),uv!==Object.prototype&&a.next&&(sv(a,u,!0,!0),cp[u]=pv)),"values"==o&&p&&"values"!==p.name&&(c=!0,v=function(){return p.call(this)}),s&&f[fv]!==v&&Af(f,fv,v),cp[e]=v,o)if(h={values:d("values"),keys:r?v:d("keys"),entries:d("entries")},s)for(l in h)!cv&&!c&&l in f||dv(f,l,h[l]);else Nf({target:e,proto:!0,forced:cv||c},h);return h},yv=Ip.set,gv=Ip.getterFor("Array Iterator");vv(Array,"Array",(function(t,e){yv(this,{type:"Array Iterator",target:hf(t),index:0,kind:e});}),(function(){var t=gv(this),e=t.target,i=t.kind,n=t.index++;return !e||n>=e.length?(t.target=void 0,{value:void 0,done:!0}):"keys"==i?{value:n,done:!1}:"values"==i?{value:e[n],done:!1}:{value:[n,e[n]],done:!1}}),"values");cp.Arguments=cp.Array;var mv=Vp("toStringTag");for(var bv in {CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}){var wv=Zc[bv],_v=wv&&wv.prototype;_v&&!_v[mv]&&Af(_v,mv,bv),cp[bv]=cp.Array;}var kv=Array.isArray||function(t){return "Array"==of(t)},xv=Vp("species"),Ov=function(t,e){var i;return kv(t)&&("function"!=typeof(i=t.constructor)||i!==Array&&!kv(i.prototype)?lf(i)&&null===(i=i[xv])&&(i=void 0):i=void 0),new(void 0===i?Array:i)(0===e?0:e)},Sv=[].push,Mv=function(t){var e=1==t,i=2==t,n=3==t,o=4==t,r=6==t,s=5==t||r;return function(a,h,l,d){for(var u,c,f=Fp(a),p=sf(f),v=Df(h,l,3),y=Hf(p.length),g=0,m=d||Ov,b=e?m(a,y):i?m(a,0):void 0;y>g;g++)if((s||g in p)&&(c=v(u=p[g],g,f),t))if(e)b[g]=c;else if(c)switch(t){case 3:return !0;case 5:return u;case 6:return g;case 2:Sv.call(b,u);}else if(o)return !1;return r?-1:n||o?o:b}},Ev={forEach:Mv(0),map:Mv(1),filter:Mv(2),some:Mv(3),every:Mv(4),find:Mv(5),findIndex:Mv(6)},Dv=function(t,e){var i=[][t];return !i||!Kc((function(){i.call(null,e||function(){throw 1},1);}))},Tv=Ev.forEach,Cv=Dv("forEach")?function(t){return Tv(this,t,arguments.length>1?arguments[1]:void 0)}:[].forEach;Nf({target:"Array",proto:!0,forced:[].forEach!=Cv},{forEach:Cv});var Pv=function(t){return Mf[t+"Prototype"]},Av=Pv("Array").forEach,Iv=Array.prototype,Fv={DOMTokenList:!0,NodeList:!0},Nv=function(t){var e=t.forEach;return t===Iv||t instanceof Array&&e===Iv.forEach||Fv.hasOwnProperty(iv(t))?Av:e},jv=mf.f,zv=Kc((function(){jv(1);}));Nf({target:"Object",stat:!0,forced:!$c||zv,sham:!$c},{getOwnPropertyDescriptor:function(t,e){return jv(hf(t),e)}});var Lv=qc((function(t){var e=Mf.Object,i=t.exports=function(t,i){return e.getOwnPropertyDescriptor(t,i)};e.getOwnPropertyDescriptor.sham&&(i.sham=!0);})),Rv=op.f,Bv={}.toString,Yv="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[],Hv={f:function(t){return Yv&&"[object Window]"==Bv.call(t)?function(t){try{return Rv(t)}catch(t){return Yv.slice()}}(t):Rv(hf(t))}},Wv={f:Vp},Vv=Pf.f,Uv=function(t){var e=Mf.Symbol||(Mf.Symbol={});cf(e,t)||Vv(e,t,{value:Wv.f(t)});},Gv=Ev.forEach,qv=xp("hidden"),Xv=Vp("toPrimitive"),Zv=Ip.set,Kv=Ip.getterFor("Symbol"),$v=Object.prototype,Jv=Zc.Symbol,Qv=ip("JSON","stringify"),ty=mf.f,ey=Pf.f,iy=Hv.f,ny=tf.f,oy=pp("symbols"),ry=pp("op-symbols"),sy=pp("string-to-symbol-registry"),ay=pp("symbol-to-string-registry"),hy=pp("wks"),ly=Zc.QObject,dy=!ly||!ly.prototype||!ly.prototype.findChild,uy=$c&&Kc((function(){return 7!=$p(ey({},"a",{get:function(){return ey(this,"a",{value:7}).a}})).a}))?function(t,e,i){var n=ty($v,e);n&&delete $v[e],ey(t,e,i),n&&t!==$v&&ey($v,e,n);}:ey,cy=function(t,e){var i=oy[t]=$p(Jv.prototype);return Zv(i,{type:"Symbol",tag:t,description:e}),$c||(i.description=e),i},fy=Rp&&"symbol"==typeof Jv.iterator?function(t){return "symbol"==typeof t}:function(t){return Object(t)instanceof Jv},py=function(t,e,i){t===$v&&py(ry,e,i),Tf(t);var n=df(e,!0);return Tf(i),cf(oy,n)?(i.enumerable?(cf(t,qv)&&t[qv][n]&&(t[qv][n]=!1),i=$p(i,{enumerable:ef(0,!1)})):(cf(t,qv)||ey(t,qv,ef(1,{})),t[qv][n]=!0),uy(t,n,i)):ey(t,n,i)},vy=function(t,e){Tf(t);var i=hf(e),n=Jf(i).concat(by(i));return Gv(n,(function(e){$c&&!yy.call(i,e)||py(t,e,i[e]);})),t},yy=function(t){var e=df(t,!0),i=ny.call(this,e);return !(this===$v&&cf(oy,e)&&!cf(ry,e))&&(!(i||!cf(this,e)||!cf(oy,e)||cf(this,qv)&&this[qv][e])||i)},gy=function(t,e){var i=hf(t),n=df(e,!0);if(i!==$v||!cf(oy,n)||cf(ry,n)){var o=ty(i,n);return !o||!cf(oy,n)||cf(i,qv)&&i[qv][n]||(o.enumerable=!0),o}},my=function(t){var e=iy(hf(t)),i=[];return Gv(e,(function(t){cf(oy,t)||cf(Xf,t)||i.push(t);})),i},by=function(t){var e=t===$v,i=iy(e?ry:hf(t)),n=[];return Gv(i,(function(t){!cf(oy,t)||e&&!cf($v,t)||n.push(oy[t]);})),n};if(Rp||(dv((Jv=function(){if(this instanceof Jv)throw TypeError("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?String(arguments[0]):void 0,e=_p(t),i=function(t){this===$v&&i.call(ry,t),cf(this,qv)&&cf(this[qv],e)&&(this[qv][e]=!1),uy(this,e,ef(1,t));};return $c&&dy&&uy($v,e,{configurable:!0,set:i}),cy(e,t)}).prototype,"toString",(function(){return Kv(this).tag})),tf.f=yy,Pf.f=py,mf.f=gy,op.f=Hv.f=my,rp.f=by,$c&&ey(Jv.prototype,"description",{configurable:!0,get:function(){return Kv(this).description}})),Bp||(Wv.f=function(t){return cy(Vp(t),t)}),Nf({global:!0,wrap:!0,forced:!Rp,sham:!Rp},{Symbol:Jv}),Gv(Jf(hy),(function(t){Uv(t);})),Nf({target:"Symbol",stat:!0,forced:!Rp},{for:function(t){var e=String(t);if(cf(sy,e))return sy[e];var i=Jv(e);return sy[e]=i,ay[i]=e,i},keyFor:function(t){if(!fy(t))throw TypeError(t+" is not a symbol");if(cf(ay,t))return ay[t]},useSetter:function(){dy=!0;},useSimple:function(){dy=!1;}}),Nf({target:"Object",stat:!0,forced:!Rp,sham:!$c},{create:function(t,e){return void 0===e?$p(t):vy($p(t),e)},defineProperty:py,defineProperties:vy,getOwnPropertyDescriptor:gy}),Nf({target:"Object",stat:!0,forced:!Rp},{getOwnPropertyNames:my,getOwnPropertySymbols:by}),Nf({target:"Object",stat:!0,forced:Kc((function(){rp.f(1);}))},{getOwnPropertySymbols:function(t){return rp.f(Fp(t))}}),Qv){var wy=!Rp||Kc((function(){var t=Jv();return "[null]"!=Qv([t])||"{}"!=Qv({a:t})||"{}"!=Qv(Object(t))}));Nf({target:"JSON",stat:!0,forced:wy},{stringify:function(t,e,i){for(var n,o=[t],r=1;arguments.length>r;)o.push(arguments[r++]);if(n=e,(lf(e)||void 0!==t)&&!fy(t))return kv(e)||(e=function(t,e){if("function"==typeof n&&(e=n.call(this,t,e)),!fy(e))return e}),o[1]=e,Qv.apply(null,o)}});}Jv.prototype[Xv]||Af(Jv.prototype,Xv,Jv.prototype.valueOf),sv(Jv,"Symbol"),Xf[qv]=!0;var _y=Mf.Object.getOwnPropertySymbols,ky=Pv("Array").entries,xy=Array.prototype,Oy={DOMTokenList:!0,NodeList:!0},Sy=function(t){var e=t.entries;return t===xy||t instanceof Array&&e===xy.entries||Oy.hasOwnProperty(iv(t))?ky:e},My=[].slice,Ey={},Dy=function(t,e,i){if(!(e in Ey)){for(var n=[],o=0;o<e;o++)n[o]="a["+o+"]";Ey[e]=Function("C,a","return new C("+n.join(",")+")");}return Ey[e](t,i)},Ty=Function.bind||function(t){var e=Ef(this),i=My.call(arguments,1),n=function(){var o=i.concat(My.call(arguments));return this instanceof n?Dy(e,o.length,o):e.apply(t,o)};return lf(e.prototype)&&(n.prototype=e.prototype),n};Nf({target:"Function",proto:!0},{bind:Ty});var Cy=Pv("Function").bind,Py=Function.prototype,Ay=function(t){var e=t.bind;return t===Py||t instanceof Function&&e===Py.bind?Cy:e},Iy=qc((function(t){var e=function(t){var e,i=Object.prototype,n=i.hasOwnProperty,o="function"==typeof Symbol?Symbol:{},r=o.iterator||"@@iterator",s=o.asyncIterator||"@@asyncIterator",a=o.toStringTag||"@@toStringTag";function h(t,e,i,n){var o=e&&e.prototype instanceof v?e:v,r=Object.create(o.prototype),s=new E(n||[]);return r._invoke=function(t,e,i){var n=d;return function(o,r){if(n===c)throw new Error("Generator is already running");if(n===f){if("throw"===o)throw r;return T()}for(i.method=o,i.arg=r;;){var s=i.delegate;if(s){var a=O(s,i);if(a){if(a===p)continue;return a}}if("next"===i.method)i.sent=i._sent=i.arg;else if("throw"===i.method){if(n===d)throw n=f,i.arg;i.dispatchException(i.arg);}else"return"===i.method&&i.abrupt("return",i.arg);n=c;var h=l(t,e,i);if("normal"===h.type){if(n=i.done?f:u,h.arg===p)continue;return {value:h.arg,done:i.done}}"throw"===h.type&&(n=f,i.method="throw",i.arg=h.arg);}}}(t,i,s),r}function l(t,e,i){try{return {type:"normal",arg:t.call(e,i)}}catch(t){return {type:"throw",arg:t}}}t.wrap=h;var d="suspendedStart",u="suspendedYield",c="executing",f="completed",p={};function v(){}function y(){}function g(){}var m={};m[r]=function(){return this};var b=Object.getPrototypeOf,w=b&&b(b(D([])));w&&w!==i&&n.call(w,r)&&(m=w);var _=g.prototype=v.prototype=Object.create(m);function k(t){["next","throw","return"].forEach((function(e){t[e]=function(t){return this._invoke(e,t)};}));}function x(t){var e;this._invoke=function(i,o){function r(){return new Promise((function(e,r){!function e(i,o,r,s){var a=l(t[i],t,o);if("throw"!==a.type){var h=a.arg,d=h.value;return d&&"object"==typeof d&&n.call(d,"__await")?Promise.resolve(d.__await).then((function(t){e("next",t,r,s);}),(function(t){e("throw",t,r,s);})):Promise.resolve(d).then((function(t){h.value=t,r(h);}),(function(t){return e("throw",t,r,s)}))}s(a.arg);}(i,o,e,r);}))}return e=e?e.then(r,r):r()};}function O(t,i){var n=t.iterator[i.method];if(n===e){if(i.delegate=null,"throw"===i.method){if(t.iterator.return&&(i.method="return",i.arg=e,O(t,i),"throw"===i.method))return p;i.method="throw",i.arg=new TypeError("The iterator does not provide a 'throw' method");}return p}var o=l(n,t.iterator,i.arg);if("throw"===o.type)return i.method="throw",i.arg=o.arg,i.delegate=null,p;var r=o.arg;return r?r.done?(i[t.resultName]=r.value,i.next=t.nextLoc,"return"!==i.method&&(i.method="next",i.arg=e),i.delegate=null,p):r:(i.method="throw",i.arg=new TypeError("iterator result is not an object"),i.delegate=null,p)}function S(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e);}function M(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e;}function E(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(S,this),this.reset(!0);}function D(t){if(t){var i=t[r];if(i)return i.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var o=-1,s=function i(){for(;++o<t.length;)if(n.call(t,o))return i.value=t[o],i.done=!1,i;return i.value=e,i.done=!0,i};return s.next=s}}return {next:T}}function T(){return {value:e,done:!0}}return y.prototype=_.constructor=g,g.constructor=y,g[a]=y.displayName="GeneratorFunction",t.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return !!e&&(e===y||"GeneratorFunction"===(e.displayName||e.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,g):(t.__proto__=g,a in t||(t[a]="GeneratorFunction")),t.prototype=Object.create(_),t},t.awrap=function(t){return {__await:t}},k(x.prototype),x.prototype[s]=function(){return this},t.AsyncIterator=x,t.async=function(e,i,n,o){var r=new x(h(e,i,n,o));return t.isGeneratorFunction(i)?r:r.next().then((function(t){return t.done?t.value:r.next()}))},k(_),_[a]="Generator",_[r]=function(){return this},_.toString=function(){return "[object Generator]"},t.keys=function(t){var e=[];for(var i in t)e.push(i);return e.reverse(),function i(){for(;e.length;){var n=e.pop();if(n in t)return i.value=n,i.done=!1,i}return i.done=!0,i}},t.values=D,E.prototype={constructor:E,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=e,this.done=!1,this.delegate=null,this.method="next",this.arg=e,this.tryEntries.forEach(M),!t)for(var i in this)"t"===i.charAt(0)&&n.call(this,i)&&!isNaN(+i.slice(1))&&(this[i]=e);},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var i=this;function o(n,o){return a.type="throw",a.arg=t,i.next=n,o&&(i.method="next",i.arg=e),!!o}for(var r=this.tryEntries.length-1;r>=0;--r){var s=this.tryEntries[r],a=s.completion;if("root"===s.tryLoc)return o("end");if(s.tryLoc<=this.prev){var h=n.call(s,"catchLoc"),l=n.call(s,"finallyLoc");if(h&&l){if(this.prev<s.catchLoc)return o(s.catchLoc,!0);if(this.prev<s.finallyLoc)return o(s.finallyLoc)}else if(h){if(this.prev<s.catchLoc)return o(s.catchLoc,!0)}else{if(!l)throw new Error("try statement without catch or finally");if(this.prev<s.finallyLoc)return o(s.finallyLoc)}}}},abrupt:function(t,e){for(var i=this.tryEntries.length-1;i>=0;--i){var o=this.tryEntries[i];if(o.tryLoc<=this.prev&&n.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var r=o;break}}r&&("break"===t||"continue"===t)&&r.tryLoc<=e&&e<=r.finallyLoc&&(r=null);var s=r?r.completion:{};return s.type=t,s.arg=e,r?(this.method="next",this.next=r.finallyLoc,p):this.complete(s)},complete:function(t,e){if("throw"===t.type)throw t.arg;return "break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),p},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var i=this.tryEntries[e];if(i.finallyLoc===t)return this.complete(i.completion,i.afterLoc),M(i),p}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var i=this.tryEntries[e];if(i.tryLoc===t){var n=i.completion;if("throw"===n.type){var o=n.arg;M(i);}return o}}throw new Error("illegal catch attempt")},delegateYield:function(t,i,n){return this.delegate={iterator:D(t),resultName:i,nextLoc:n},"next"===this.method&&(this.arg=e),p}},t}(t.exports);try{regeneratorRuntime=e;}catch(t){Function("r","regeneratorRuntime = r")(e);}}));Uv("iterator");var Fy=function(t){return function(e,i){var n,o,r=String(af(e)),s=Bf(i),a=r.length;return s<0||s>=a?t?"":void 0:(n=r.charCodeAt(s))<55296||n>56319||s+1===a||(o=r.charCodeAt(s+1))<56320||o>57343?t?r.charAt(s):n:t?r.slice(s,s+2):o-56320+(n-55296<<10)+65536}},Ny={codeAt:Fy(!1),charAt:Fy(!0)}.charAt,jy=Ip.set,zy=Ip.getterFor("String Iterator");vv(String,"String",(function(t){jy(this,{type:"String Iterator",string:String(t),index:0});}),(function(){var t,e=zy(this),i=e.string,n=e.index;return n>=i.length?{value:void 0,done:!0}:(t=Ny(i,n),e.index+=t.length,{value:t,done:!1})}));var Ly=Wv.f("iterator"),Ry=Ly,By=ip("JSON","stringify"),Yy=/[\uD800-\uDFFF]/g,Hy=/^[\uD800-\uDBFF]$/,Wy=/^[\uDC00-\uDFFF]$/,Vy=function(t,e,i){var n=i.charAt(e-1),o=i.charAt(e+1);return Hy.test(t)&&!Wy.test(o)||Wy.test(t)&&!Hy.test(n)?"\\u"+t.charCodeAt(0).toString(16):t},Uy=Kc((function(){return '"\\udf06\\ud834"'!==By("\udf06\ud834")||'"\\udead"'!==By("\udead")}));By&&Nf({target:"JSON",stat:!0,forced:Uy},{stringify:function(t,e,i){var n=By.apply(null,arguments);return "string"==typeof n?n.replace(Yy,Vy):n}}),Mf.JSON||(Mf.JSON={stringify:JSON.stringify});var Gy=function(t,e,i){return Mf.JSON.stringify.apply(null,arguments)},qy=jf;var Xy=function(t,e,i){return e in t?qy(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t},Zy=Pv("Array").values,Ky=Array.prototype,$y={DOMTokenList:!0,NodeList:!0},Jy=function(t){var e=t.values;return t===Ky||t instanceof Array&&e===Ky.values||$y.hasOwnProperty(iv(t))?Zy:e},Qy=Vp("iterator"),tg=function(t){if(null!=t)return t[Qy]||t["@@iterator"]||cp[iv(t)]},eg=function(t){var e=tg(t);if("function"!=typeof e)throw TypeError(String(t)+" is not iterable");return Tf(e.call(t))},ig=[],ng=ig.sort,og=Kc((function(){ig.sort(void 0);})),rg=Kc((function(){ig.sort(null);})),sg=Dv("sort");Nf({target:"Array",proto:!0,forced:og||!rg||sg},{sort:function(t){return void 0===t?ng.call(Fp(this)):ng.call(Fp(this),Ef(t))}});var ag=Pv("Array").sort,hg=Array.prototype,lg=function(t){var e=t.sort;return t===hg||t instanceof Array&&e===hg.sort?ag:e},dg=function(t){return function(e,i,n,o){Ef(i);var r=Fp(e),s=sf(r),a=Hf(r.length),h=t?a-1:0,l=t?-1:1;if(n<2)for(;;){if(h in s){o=s[h],h+=l;break}if(h+=l,t?h<0:a<=h)throw TypeError("Reduce of empty array with no initial value")}for(;t?h>=0:a>h;h+=l)h in s&&(o=i(o,s[h],h,r));return o}},ug={left:dg(!1),right:dg(!0)}.left;Nf({target:"Array",proto:!0,forced:Dv("reduce")},{reduce:function(t){return ug(this,t,arguments.length,arguments.length>1?arguments[1]:void 0)}});var cg=Pv("Array").reduce,fg=Array.prototype,pg=function(t){var e=t.reduce;return t===fg||t instanceof Array&&e===fg.reduce?cg:e},vg=Pv("Array").keys,yg=Array.prototype,gg={DOMTokenList:!0,NodeList:!0},mg=function(t){var e=t.keys;return t===yg||t instanceof Array&&e===yg.keys||gg.hasOwnProperty(iv(t))?vg:e};Nf({target:"Array",stat:!0},{isArray:kv});var bg=Mf.Array.isArray,wg=bg;var _g=function(t){if(wg(t)){for(var e=0,i=new Array(t.length);e<t.length;e++)i[e]=t[e];return i}},kg=function(t,e,i,n){try{return n?e(Tf(i)[0],i[1]):e(i)}catch(e){var o=t.return;throw void 0!==o&&Tf(o.call(t)),e}},xg=Vp("iterator"),Og=Array.prototype,Sg=function(t){return void 0!==t&&(cp.Array===t||Og[xg]===t)},Mg=Vp("iterator"),Eg=!1;try{var Dg=0,Tg={next:function(){return {done:!!Dg++}},return:function(){Eg=!0;}};Tg[Mg]=function(){return this},Array.from(Tg,(function(){throw 2}));}catch(t){}var Cg=!function(t,e){if(!e&&!Eg)return !1;var i=!1;try{var n={};n[Mg]=function(){return {next:function(){return {done:i=!0}}}},t(n);}catch(t){}return i}((function(t){Array.from(t);}));Nf({target:"Array",stat:!0,forced:Cg},{from:function(t){var e,i,n,o,r,s=Fp(t),a="function"==typeof this?this:Array,h=arguments.length,l=h>1?arguments[1]:void 0,d=void 0!==l,u=0,c=tg(s);if(d&&(l=Df(l,h>2?arguments[2]:void 0,2)),null==c||a==Array&&Sg(c))for(i=new a(e=Hf(s.length));e>u;u++)ap(i,u,d?l(s[u],u):s[u]);else for(r=(o=c.call(s)).next,i=new a;!(n=r.call(o)).done;u++)ap(i,u,d?kg(o,l,[n.value,u],!0):n.value);return i.length=u,i}});var Pg=Mf.Array.from,Ag=Vp("iterator"),Ig=function(t){var e=Object(t);return void 0!==e[Ag]||"@@iterator"in e||cp.hasOwnProperty(iv(e))};var Fg=function(t){if(Ig(Object(t))||"[object Arguments]"===Object.prototype.toString.call(t))return Pg(t)};var Ng=function(){throw new TypeError("Invalid attempt to spread non-iterable instance")};var jg,zg,Lg=function(t){return _g(t)||Fg(t)||Ng()},Rg=ip("navigator","userAgent")||"",Bg=Zc.process,Yg=Bg&&Bg.versions,Hg=Yg&&Yg.v8;Hg?zg=(jg=Hg.split("."))[0]+jg[1]:Rg&&(!(jg=Rg.match(/Edge\/(\d+)/))||jg[1]>=74)&&(jg=Rg.match(/Chrome\/(\d+)/))&&(zg=jg[1]);var Wg=zg&&+zg,Vg=Vp("species"),Ug=function(t){return Wg>=51||!Kc((function(){var e=[];return (e.constructor={})[Vg]=function(){return {foo:1}},1!==e[t](Boolean).foo}))},Gg=Ev.filter,qg=Ug("filter"),Xg=qg&&!Kc((function(){[].filter.call({length:-1,0:1},(function(t){throw t}));}));Nf({target:"Array",proto:!0,forced:!qg||!Xg},{filter:function(t){return Gg(this,t,arguments.length>1?arguments[1]:void 0)}});var Zg=Pv("Array").filter,Kg=Array.prototype,$g=function(t){var e=t.filter;return t===Kg||t instanceof Array&&e===Kg.filter?Zg:e},Jg=Vp("isConcatSpreadable"),Qg=Wg>=51||!Kc((function(){var t=[];return t[Jg]=!1,t.concat()[0]!==t})),tm=Ug("concat"),em=function(t){if(!lf(t))return !1;var e=t[Jg];return void 0!==e?!!e:kv(t)};Nf({target:"Array",proto:!0,forced:!Qg||!tm},{concat:function(t){var e,i,n,o,r,s=Fp(this),a=Ov(s,0),h=0;for(e=-1,n=arguments.length;e<n;e++)if(r=-1===e?s:arguments[e],em(r)){if(h+(o=Hf(r.length))>9007199254740991)throw TypeError("Maximum allowed index exceeded");for(i=0;i<o;i++,h++)i in r&&ap(a,h,r[i]);}else{if(h>=9007199254740991)throw TypeError("Maximum allowed index exceeded");ap(a,h++,r);}return a.length=h,a}});var im=Pv("Array").concat,nm=Array.prototype,om=function(t){var e=t.concat;return t===nm||t instanceof Array&&e===nm.concat?im:e},rm=Object.assign,sm=Object.defineProperty,am=!rm||Kc((function(){if($c&&1!==rm({b:1},rm(sm({},"a",{enumerable:!0,get:function(){sm(this,"b",{value:3,enumerable:!1});}}),{b:2})).b)return !0;var t={},e={},i=Symbol();return t[i]=7,"abcdefghijklmnopqrst".split("").forEach((function(t){e[t]=t;})),7!=rm({},t)[i]||"abcdefghijklmnopqrst"!=Jf(rm({},e)).join("")}))?function(t,e){for(var i=Fp(t),n=arguments.length,o=1,r=rp.f,s=tf.f;n>o;)for(var a,h=sf(arguments[o++]),l=r?Jf(h).concat(r(h)):Jf(h),d=l.length,u=0;d>u;)a=l[u++],$c&&!s.call(h,a)||(i[a]=h[a]);return i}:rm;Nf({target:"Object",stat:!0,forced:Object.assign!==am},{assign:am});var hm=Mf.Object.assign,lm=Ev.some;Nf({target:"Array",proto:!0,forced:Dv("some")},{some:function(t){return lm(this,t,arguments.length>1?arguments[1]:void 0)}});var dm=Pv("Array").some,um=Array.prototype,cm=function(t){var e=t.some;return t===um||t instanceof Array&&e===um.some?dm:e},fm=Ev.map,pm=Ug("map"),vm=pm&&!Kc((function(){[].map.call({length:-1,0:1},(function(t){throw t}));}));Nf({target:"Array",proto:!0,forced:!pm||!vm},{map:function(t){return fm(this,t,arguments.length>1?arguments[1]:void 0)}});var ym=Pv("Array").map,gm=Array.prototype,mm=function(t){var e=t.map;return t===gm||t instanceof Array&&e===gm.map?ym:e},bm=Ly;Uv("asyncIterator"),Uv("hasInstance"),Uv("isConcatSpreadable"),Uv("match"),Uv("matchAll"),Uv("replace"),Uv("search"),Uv("species"),Uv("split"),Uv("toPrimitive"),Uv("toStringTag"),Uv("unscopables"),sv(Math,"Math",!0),sv(Zc.JSON,"JSON",!0);var wm=Mf.Symbol;Uv("asyncDispose"),Uv("dispose"),Uv("observable"),Uv("patternMatch"),Uv("replaceAll");var _m=wm,km=qc((function(t){function e(t){return (e="function"==typeof _m&&"symbol"==typeof bm?function(t){return typeof t}:function(t){return t&&"function"==typeof _m&&t.constructor===_m&&t!==_m.prototype?"symbol":typeof t})(t)}function i(n){return "function"==typeof _m&&"symbol"===e(bm)?t.exports=i=function(t){return e(t)}:t.exports=i=function(t){return t&&"function"==typeof _m&&t.constructor===_m&&t!==_m.prototype?"symbol":e(t)},i(n)}t.exports=i;})),xm=Kc((function(){Jf(1);}));Nf({target:"Object",stat:!0,forced:xm},{keys:function(t){return Jf(Fp(t))}});var Om=Mf.Object.keys,Sm=!Kc((function(){return Object.isExtensible(Object.preventExtensions({}))})),Mm=qc((function(t){var e=Pf.f,i=_p("meta"),n=0,o=Object.isExtensible||function(){return !0},r=function(t){e(t,i,{value:{objectID:"O"+ ++n,weakData:{}}});},s=t.exports={REQUIRED:!1,fastKey:function(t,e){if(!lf(t))return "symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!cf(t,i)){if(!o(t))return "F";if(!e)return "E";r(t);}return t[i].objectID},getWeakData:function(t,e){if(!cf(t,i)){if(!o(t))return !0;if(!e)return !1;r(t);}return t[i].weakData},onFreeze:function(t){return Sm&&s.REQUIRED&&o(t)&&!cf(t,i)&&r(t),t}};Xf[i]=!0;})),Em=(Mm.REQUIRED,Mm.fastKey,Mm.getWeakData,Mm.onFreeze,qc((function(t){var e=function(t,e){this.stopped=t,this.result=e;};(t.exports=function(t,i,n,o,r){var s,a,h,l,d,u,c,f=Df(i,n,o?2:1);if(r)s=t;else{if("function"!=typeof(a=tg(t)))throw TypeError("Target is not iterable");if(Sg(a)){for(h=0,l=Hf(t.length);l>h;h++)if((d=o?f(Tf(c=t[h])[0],c[1]):f(t[h]))&&d instanceof e)return d;return new e(!1)}s=a.call(t);}for(u=s.next;!(c=u.call(s)).done;)if("object"==typeof(d=kg(s,f,c.value,o))&&d&&d instanceof e)return d;return new e(!1)}).stop=function(t){return new e(!0,t)};}))),Dm=function(t,e,i){if(!(t instanceof e))throw TypeError("Incorrect "+(i?i+" ":"")+"invocation");return t},Tm=Pf.f,Cm=Ev.forEach,Pm=Ip.set,Am=Ip.getterFor,Im=function(t,e,i){var n,o=-1!==t.indexOf("Map"),r=-1!==t.indexOf("Weak"),s=o?"set":"add",a=Zc[t],h=a&&a.prototype,l={};if($c&&"function"==typeof a&&(r||h.forEach&&!Kc((function(){(new a).entries().next();})))){n=e((function(e,i){Pm(Dm(e,n,t),{type:t,collection:new a}),null!=i&&Em(i,e[s],e,o);}));var d=Am(t);Cm(["add","clear","delete","forEach","get","has","set","keys","values","entries"],(function(t){var e="add"==t||"set"==t;t in h&&(!r||"clear"!=t)&&Af(n.prototype,t,(function(i,n){var o=d(this).collection;if(!e&&r&&!lf(i))return "get"==t&&void 0;var s=o[t](0===i?0:i,n);return e?this:s}));})),r||Tm(n.prototype,"size",{configurable:!0,get:function(){return d(this).collection.size}});}else n=i.getConstructor(e,t,o,s),Mm.REQUIRED=!0;return sv(n,t,!1,!0),l[t]=n,Nf({global:!0,forced:!0},l),r||i.setStrong(n,t,o),n},Fm=function(t,e,i){for(var n in e)i&&i.unsafe&&t[n]?t[n]=e[n]:dv(t,n,e[n],i);return t},Nm=Vp("species"),jm=Pf.f,zm=Mm.fastKey,Lm=Ip.set,Rm=Ip.getterFor,Bm={getConstructor:function(t,e,i,n){var o=t((function(t,r){Dm(t,o,e),Lm(t,{type:e,index:$p(null),first:void 0,last:void 0,size:0}),$c||(t.size=0),null!=r&&Em(r,t[n],t,i);})),r=Rm(e),s=function(t,e,i){var n,o,s=r(t),h=a(t,e);return h?h.value=i:(s.last=h={index:o=zm(e,!0),key:e,value:i,previous:n=s.last,next:void 0,removed:!1},s.first||(s.first=h),n&&(n.next=h),$c?s.size++:t.size++,"F"!==o&&(s.index[o]=h)),t},a=function(t,e){var i,n=r(t),o=zm(e);if("F"!==o)return n.index[o];for(i=n.first;i;i=i.next)if(i.key==e)return i};return Fm(o.prototype,{clear:function(){for(var t=r(this),e=t.index,i=t.first;i;)i.removed=!0,i.previous&&(i.previous=i.previous.next=void 0),delete e[i.index],i=i.next;t.first=t.last=void 0,$c?t.size=0:this.size=0;},delete:function(t){var e=r(this),i=a(this,t);if(i){var n=i.next,o=i.previous;delete e.index[i.index],i.removed=!0,o&&(o.next=n),n&&(n.previous=o),e.first==i&&(e.first=n),e.last==i&&(e.last=o),$c?e.size--:this.size--;}return !!i},forEach:function(t){for(var e,i=r(this),n=Df(t,arguments.length>1?arguments[1]:void 0,3);e=e?e.next:i.first;)for(n(e.value,e.key,this);e&&e.removed;)e=e.previous;},has:function(t){return !!a(this,t)}}),Fm(o.prototype,i?{get:function(t){var e=a(this,t);return e&&e.value},set:function(t,e){return s(this,0===t?0:t,e)}}:{add:function(t){return s(this,t=0===t?0:t,t)}}),$c&&jm(o.prototype,"size",{get:function(){return r(this).size}}),o},setStrong:function(t,e,i){var n=e+" Iterator",o=Rm(e),r=Rm(n);vv(t,e,(function(t,e){Lm(this,{type:n,target:t,state:o(t),kind:e,last:void 0});}),(function(){for(var t=r(this),e=t.kind,i=t.last;i&&i.removed;)i=i.previous;return t.target&&(t.last=i=i?i.next:t.state.first)?"keys"==e?{value:i.key,done:!1}:"values"==e?{value:i.value,done:!1}:{value:[i.key,i.value],done:!1}:(t.target=void 0,{value:void 0,done:!0})}),i?"entries":"values",!i,!0),function(t){var e=ip(t),i=Pf.f;$c&&e&&!e[Nm]&&i(e,Nm,{configurable:!0,get:function(){return this}});}(e);}},Ym=(Im("Map",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),Bm),Mf.Map),Hm=bg;var Wm=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")};function Vm(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),qy(t,n.key,n);}}var Um=function(t,e,i){return e&&Vm(t.prototype,e),i&&Vm(t,i),t};var Gm=function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t};var qm=function(t,e){return !e||"object"!==km(e)&&"function"!=typeof e?Gm(t):e},Xm=Kc((function(){Lp(1);}));Nf({target:"Object",stat:!0,forced:Xm,sham:!Np},{getPrototypeOf:function(t){return Lp(Fp(t))}});var Zm=Mf.Object.getPrototypeOf;Nf({target:"Object",stat:!0},{setPrototypeOf:lv});var Km=Mf.Object.setPrototypeOf,$m=qc((function(t){function e(i){return t.exports=e=Km?Zm:function(t){return t.__proto__||Zm(t)},e(i)}t.exports=e;}));Nf({target:"Object",stat:!0,sham:!$c},{create:$p});var Jm=Mf.Object,Qm=function(t,e){return Jm.create(t,e)},tb=Qm,eb=qc((function(t){function e(i,n){return t.exports=e=Km||function(t,e){return t.__proto__=e,t},e(i,n)}t.exports=e;}));for(var ib=function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=tb(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&eb(t,e);},nb=[],ob=0;ob<256;ob++)nb[ob]=(ob+256).toString(16).substr(1);for(var rb=function(){if("undefined"!=typeof crypto&&crypto.getRandomValues){var t=new Uint8Array(16);return function(){return crypto.getRandomValues(t),t}}var e=new Array(16);return function(){for(var t,i=0;i<16;i++)0==(3&i)&&(t=4294967296*Math.random()),e[i]=t>>>((3&i)<<3)&255;return e}}(),sb=[],ab=0;ab<256;ab++)sb[ab]=(ab+256).toString(16).substr(1);var hb=rb();hb[0],hb[1],hb[2],hb[3],hb[4],hb[5],hb[6],hb[7];function lb(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=arguments.length>1?arguments[1]:void 0,i=arguments.length>2?arguments[2]:void 0,n=e&&i||0;"string"==typeof t&&(e="binary"===t?new Array(16):void 0,t={});var o=t.random||(t.rng||rb)();if(o[6]=15&o[6]|64,o[8]=63&o[8]|128,e)for(var r=0;r<16;r++)e[n+r]=o[r];return e||function(t,e){var i=e||0,n=nb;return n[t[i++]]+n[t[i++]]+n[t[i++]]+n[t[i++]]+"-"+n[t[i++]]+n[t[i++]]+"-"+n[t[i++]]+n[t[i++]]+"-"+n[t[i++]]+n[t[i++]]+"-"+n[t[i++]]+n[t[i++]]+n[t[i++]]+n[t[i++]]+n[t[i++]]+n[t[i++]]}(o)}var db="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function ub(t,e){return t(e={exports:{}},e.exports),e.exports}var cb=function(t){return t&&t.Math==Math&&t},fb=cb("object"==typeof globalThis&&globalThis)||cb("object"==typeof window&&window)||cb("object"==typeof self&&self)||cb("object"==typeof db&&db)||Function("return this")(),pb=function(t){try{return !!t()}catch(t){return !0}},vb=!pb((function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a})),yb={}.propertyIsEnumerable,gb=Object.getOwnPropertyDescriptor,mb={f:gb&&!yb.call({1:2},1)?function(t){var e=gb(this,t);return !!e&&e.enumerable}:yb},bb=function(t,e){return {enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}},wb={}.toString,_b=function(t){return wb.call(t).slice(8,-1)},kb="".split,xb=pb((function(){return !Object("z").propertyIsEnumerable(0)}))?function(t){return "String"==_b(t)?kb.call(t,""):Object(t)}:Object,Ob=function(t){if(null==t)throw TypeError("Can't call method on "+t);return t},Sb=function(t){return xb(Ob(t))},Mb=function(t){return "object"==typeof t?null!==t:"function"==typeof t},Eb=function(t,e){if(!Mb(t))return t;var i,n;if(e&&"function"==typeof(i=t.toString)&&!Mb(n=i.call(t)))return n;if("function"==typeof(i=t.valueOf)&&!Mb(n=i.call(t)))return n;if(!e&&"function"==typeof(i=t.toString)&&!Mb(n=i.call(t)))return n;throw TypeError("Can't convert object to primitive value")},Db={}.hasOwnProperty,Tb=function(t,e){return Db.call(t,e)},Cb=fb.document,Pb=Mb(Cb)&&Mb(Cb.createElement),Ab=function(t){return Pb?Cb.createElement(t):{}},Ib=!vb&&!pb((function(){return 7!=Object.defineProperty(Ab("div"),"a",{get:function(){return 7}}).a})),Fb=Object.getOwnPropertyDescriptor,Nb={f:vb?Fb:function(t,e){if(t=Sb(t),e=Eb(e,!0),Ib)try{return Fb(t,e)}catch(t){}if(Tb(t,e))return bb(!mb.f.call(t,e),t[e])}},jb=/#|\.prototype\./,zb=function(t,e){var i=Rb[Lb(t)];return i==Yb||i!=Bb&&("function"==typeof e?pb(e):!!e)},Lb=zb.normalize=function(t){return String(t).replace(jb,".").toLowerCase()},Rb=zb.data={},Bb=zb.NATIVE="N",Yb=zb.POLYFILL="P",Hb=zb,Wb={},Vb=function(t,e,i){if(function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function")}(t),void 0===e)return t;switch(i){case 0:return function(){return t.call(e)};case 1:return function(i){return t.call(e,i)};case 2:return function(i,n){return t.call(e,i,n)};case 3:return function(i,n,o){return t.call(e,i,n,o)}}return function(){return t.apply(e,arguments)}},Ub=function(t){if(!Mb(t))throw TypeError(String(t)+" is not an object");return t},Gb=Object.defineProperty,qb={f:vb?Gb:function(t,e,i){if(Ub(t),e=Eb(e,!0),Ub(i),Ib)try{return Gb(t,e,i)}catch(t){}if("get"in i||"set"in i)throw TypeError("Accessors not supported");return "value"in i&&(t[e]=i.value),t}},Xb=vb?function(t,e,i){return qb.f(t,e,bb(1,i))}:function(t,e,i){return t[e]=i,t},Zb=Nb.f,Kb=function(t){var e=function(e,i,n){if(this instanceof t){switch(arguments.length){case 0:return new t;case 1:return new t(e);case 2:return new t(e,i)}return new t(e,i,n)}return t.apply(this,arguments)};return e.prototype=t.prototype,e},$b=function(t,e){var i,n,o,r,s,a,h,l,d=t.target,u=t.global,c=t.stat,f=t.proto,p=u?fb:c?fb[d]:(fb[d]||{}).prototype,v=u?Wb:Wb[d]||(Wb[d]={}),y=v.prototype;for(o in e)i=!Hb(u?o:d+(c?".":"#")+o,t.forced)&&p&&Tb(p,o),s=v[o],i&&(a=t.noTargetGet?(l=Zb(p,o))&&l.value:p[o]),r=i&&a?a:e[o],i&&typeof s==typeof r||(h=t.bind&&i?Vb(r,fb):t.wrap&&i?Kb(r):f&&"function"==typeof r?Vb(Function.call,r):r,(t.sham||r&&r.sham||s&&s.sham)&&Xb(h,"sham",!0),v[o]=h,f&&(Tb(Wb,n=d+"Prototype")||Xb(Wb,n,{}),Wb[n][o]=r,t.real&&y&&!y[o]&&Xb(y,o,r)));};$b({target:"Object",stat:!0,forced:!vb,sham:!vb},{defineProperty:qb.f});ub((function(t){var e=Wb.Object,i=t.exports=function(t,i,n){return e.defineProperty(t,i,n)};e.defineProperty.sham&&(i.sham=!0);}));var Jb=Math.ceil,Qb=Math.floor,tw=function(t){return isNaN(t=+t)?0:(t>0?Qb:Jb)(t)},ew=Math.min,iw=function(t){return t>0?ew(tw(t),9007199254740991):0},nw=Math.max,ow=Math.min,rw=function(t,e){var i=tw(t);return i<0?nw(i+e,0):ow(i,e)},sw=function(t){return function(e,i,n){var o,r=Sb(e),s=iw(r.length),a=rw(n,s);if(t&&i!=i){for(;s>a;)if((o=r[a++])!=o)return !0}else for(;s>a;a++)if((t||a in r)&&r[a]===i)return t||a||0;return !t&&-1}},aw={includes:sw(!0),indexOf:sw(!1)},hw={},lw=aw.indexOf,dw=function(t,e){var i,n=Sb(t),o=0,r=[];for(i in n)!Tb(hw,i)&&Tb(n,i)&&r.push(i);for(;e.length>o;)Tb(n,i=e[o++])&&(~lw(r,i)||r.push(i));return r},uw=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],cw=Object.keys||function(t){return dw(t,uw)},fw=vb?Object.defineProperties:function(t,e){Ub(t);for(var i,n=cw(e),o=n.length,r=0;o>r;)qb.f(t,i=n[r++],e[i]);return t};$b({target:"Object",stat:!0,forced:!vb,sham:!vb},{defineProperties:fw});ub((function(t){var e=Wb.Object,i=t.exports=function(t,i){return e.defineProperties(t,i)};e.defineProperties.sham&&(i.sham=!0);}));var pw=function(t){return "function"==typeof t?t:void 0},vw=function(t,e){return arguments.length<2?pw(Wb[t])||pw(fb[t]):Wb[t]&&Wb[t][e]||fb[t]&&fb[t][e]},yw=uw.concat("length","prototype"),gw={f:Object.getOwnPropertyNames||function(t){return dw(t,yw)}},mw={f:Object.getOwnPropertySymbols},bw=vw("Reflect","ownKeys")||function(t){var e=gw.f(Ub(t)),i=mw.f;return i?e.concat(i(t)):e},ww=function(t,e,i){var n=Eb(e);n in t?qb.f(t,n,bb(0,i)):t[n]=i;};$b({target:"Object",stat:!0,sham:!vb},{getOwnPropertyDescriptors:function(t){for(var e,i,n=Sb(t),o=Nb.f,r=bw(n),s={},a=0;r.length>a;)void 0!==(i=o(n,e=r[a++]))&&ww(s,e,i);return s}});Wb.Object.getOwnPropertyDescriptors;var _w=Nb.f,kw=pb((function(){_w(1);}));$b({target:"Object",stat:!0,forced:!vb||kw,sham:!vb},{getOwnPropertyDescriptor:function(t,e){return _w(Sb(t),e)}});ub((function(t){var e=Wb.Object,i=t.exports=function(t,i){return e.getOwnPropertyDescriptor(t,i)};e.getOwnPropertyDescriptor.sham&&(i.sham=!0);}));var xw=!!Object.getOwnPropertySymbols&&!pb((function(){return !String(Symbol())})),Ow=Array.isArray||function(t){return "Array"==_b(t)},Sw=function(t){return Object(Ob(t))},Mw=vw("document","documentElement"),Ew=fb["__core-js_shared__"]||function(t,e){try{Xb(fb,t,e);}catch(i){fb[t]=e;}return e}("__core-js_shared__",{}),Dw=ub((function(t){(t.exports=function(t,e){return Ew[t]||(Ew[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.4.1",mode:"pure",copyright:"© 2019 Denis Pushkarev (zloirock.ru)"});})),Tw=0,Cw=Math.random(),Pw=function(t){return "Symbol("+String(void 0===t?"":t)+")_"+(++Tw+Cw).toString(36)},Aw=Dw("keys"),Iw=function(t){return Aw[t]||(Aw[t]=Pw(t))},Fw=Iw("IE_PROTO"),Nw=function(){},jw=function(){var t,e=Ab("iframe"),i=uw.length;for(e.style.display="none",Mw.appendChild(e),e.src=String("javascript:"),(t=e.contentWindow.document).open(),t.write("<script>document.F=Object<\/script>"),t.close(),jw=t.F;i--;)delete jw.prototype[uw[i]];return jw()},zw=Object.create||function(t,e){var i;return null!==t?(Nw.prototype=Ub(t),i=new Nw,Nw.prototype=null,i[Fw]=t):i=jw(),void 0===e?i:fw(i,e)};hw[Fw]=!0;var Lw=gw.f,Rw={}.toString,Bw="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[],Yw={f:function(t){return Bw&&"[object Window]"==Rw.call(t)?function(t){try{return Lw(t)}catch(t){return Bw.slice()}}(t):Lw(Sb(t))}},Hw=function(t,e,i,n){n&&n.enumerable?t[e]=i:Xb(t,e,i);},Ww=fb.Symbol,Vw=Dw("wks"),Uw=function(t){return Vw[t]||(Vw[t]=xw&&Ww[t]||(xw?Ww:Pw)("Symbol."+t))},Gw={f:Uw},qw=qb.f,Xw=function(t){var e=Wb.Symbol||(Wb.Symbol={});Tb(e,t)||qw(e,t,{value:Gw.f(t)});},Zw=Uw("toStringTag"),Kw="Arguments"==_b(function(){return arguments}()),$w=function(t){var e,i,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(i=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),Zw))?i:Kw?_b(e):"Object"==(n=_b(e))&&"function"==typeof e.callee?"Arguments":n},Jw={};Jw[Uw("toStringTag")]="z";var Qw,t_,e_,i_="[object z]"!==String(Jw)?function(){return "[object "+$w(this)+"]"}:Jw.toString,n_=qb.f,o_=Uw("toStringTag"),r_=i_!=={}.toString,s_=function(t,e,i,n){if(t){var o=i?t:t.prototype;Tb(o,o_)||n_(o,o_,{configurable:!0,value:e}),n&&r_&&Xb(o,"toString",i_);}},a_=Dw("native-function-to-string",Function.toString),h_=fb.WeakMap,l_="function"==typeof h_&&/native code/.test(a_.call(h_)),d_=fb.WeakMap;if(l_){var u_=new d_,c_=u_.get,f_=u_.has,p_=u_.set;Qw=function(t,e){return p_.call(u_,t,e),e},t_=function(t){return c_.call(u_,t)||{}},e_=function(t){return f_.call(u_,t)};}else{var v_=Iw("state");hw[v_]=!0,Qw=function(t,e){return Xb(t,v_,e),e},t_=function(t){return Tb(t,v_)?t[v_]:{}},e_=function(t){return Tb(t,v_)};}var y_={set:Qw,get:t_,has:e_,enforce:function(t){return e_(t)?t_(t):Qw(t,{})},getterFor:function(t){return function(e){var i;if(!Mb(e)||(i=t_(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return i}}},g_=Uw("species"),m_=function(t,e){var i;return Ow(t)&&("function"!=typeof(i=t.constructor)||i!==Array&&!Ow(i.prototype)?Mb(i)&&null===(i=i[g_])&&(i=void 0):i=void 0),new(void 0===i?Array:i)(0===e?0:e)},b_=[].push,w_=function(t){var e=1==t,i=2==t,n=3==t,o=4==t,r=6==t,s=5==t||r;return function(a,h,l,d){for(var u,c,f=Sw(a),p=xb(f),v=Vb(h,l,3),y=iw(p.length),g=0,m=d||m_,b=e?m(a,y):i?m(a,0):void 0;y>g;g++)if((s||g in p)&&(c=v(u=p[g],g,f),t))if(e)b[g]=c;else if(c)switch(t){case 3:return !0;case 5:return u;case 6:return g;case 2:b_.call(b,u);}else if(o)return !1;return r?-1:n||o?o:b}},__={forEach:w_(0),map:w_(1),filter:w_(2),some:w_(3),every:w_(4),find:w_(5),findIndex:w_(6)},k_=__.forEach,x_=Iw("hidden"),O_=Uw("toPrimitive"),S_=y_.set,M_=y_.getterFor("Symbol"),E_=Object.prototype,D_=fb.Symbol,T_=vw("JSON","stringify"),C_=Nb.f,P_=qb.f,A_=Yw.f,I_=mb.f,F_=Dw("symbols"),N_=Dw("op-symbols"),j_=Dw("string-to-symbol-registry"),z_=Dw("symbol-to-string-registry"),L_=Dw("wks"),R_=fb.QObject,B_=!R_||!R_.prototype||!R_.prototype.findChild,Y_=vb&&pb((function(){return 7!=zw(P_({},"a",{get:function(){return P_(this,"a",{value:7}).a}})).a}))?function(t,e,i){var n=C_(E_,e);n&&delete E_[e],P_(t,e,i),n&&t!==E_&&P_(E_,e,n);}:P_,H_=function(t,e){var i=F_[t]=zw(D_.prototype);return S_(i,{type:"Symbol",tag:t,description:e}),vb||(i.description=e),i},W_=xw&&"symbol"==typeof D_.iterator?function(t){return "symbol"==typeof t}:function(t){return Object(t)instanceof D_},V_=function(t,e,i){t===E_&&V_(N_,e,i),Ub(t);var n=Eb(e,!0);return Ub(i),Tb(F_,n)?(i.enumerable?(Tb(t,x_)&&t[x_][n]&&(t[x_][n]=!1),i=zw(i,{enumerable:bb(0,!1)})):(Tb(t,x_)||P_(t,x_,bb(1,{})),t[x_][n]=!0),Y_(t,n,i)):P_(t,n,i)},U_=function(t,e){Ub(t);var i=Sb(e),n=cw(i).concat(Z_(i));return k_(n,(function(e){vb&&!G_.call(i,e)||V_(t,e,i[e]);})),t},G_=function(t){var e=Eb(t,!0),i=I_.call(this,e);return !(this===E_&&Tb(F_,e)&&!Tb(N_,e))&&(!(i||!Tb(this,e)||!Tb(F_,e)||Tb(this,x_)&&this[x_][e])||i)},q_=function(t,e){var i=Sb(t),n=Eb(e,!0);if(i!==E_||!Tb(F_,n)||Tb(N_,n)){var o=C_(i,n);return !o||!Tb(F_,n)||Tb(i,x_)&&i[x_][n]||(o.enumerable=!0),o}},X_=function(t){var e=A_(Sb(t)),i=[];return k_(e,(function(t){Tb(F_,t)||Tb(hw,t)||i.push(t);})),i},Z_=function(t){var e=t===E_,i=A_(e?N_:Sb(t)),n=[];return k_(i,(function(t){!Tb(F_,t)||e&&!Tb(E_,t)||n.push(F_[t]);})),n};if(xw||(Hw((D_=function(){if(this instanceof D_)throw TypeError("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?String(arguments[0]):void 0,e=Pw(t),i=function(t){this===E_&&i.call(N_,t),Tb(this,x_)&&Tb(this[x_],e)&&(this[x_][e]=!1),Y_(this,e,bb(1,t));};return vb&&B_&&Y_(E_,e,{configurable:!0,set:i}),H_(e,t)}).prototype,"toString",(function(){return M_(this).tag})),mb.f=G_,qb.f=V_,Nb.f=q_,gw.f=Yw.f=X_,mw.f=Z_,vb&&P_(D_.prototype,"description",{configurable:!0,get:function(){return M_(this).description}}),Gw.f=function(t){return H_(Uw(t),t)}),$b({global:!0,wrap:!0,forced:!xw,sham:!xw},{Symbol:D_}),k_(cw(L_),(function(t){Xw(t);})),$b({target:"Symbol",stat:!0,forced:!xw},{for:function(t){var e=String(t);if(Tb(j_,e))return j_[e];var i=D_(e);return j_[e]=i,z_[i]=e,i},keyFor:function(t){if(!W_(t))throw TypeError(t+" is not a symbol");if(Tb(z_,t))return z_[t]},useSetter:function(){B_=!0;},useSimple:function(){B_=!1;}}),$b({target:"Object",stat:!0,forced:!xw,sham:!vb},{create:function(t,e){return void 0===e?zw(t):U_(zw(t),e)},defineProperty:V_,defineProperties:U_,getOwnPropertyDescriptor:q_}),$b({target:"Object",stat:!0,forced:!xw},{getOwnPropertyNames:X_,getOwnPropertySymbols:Z_}),$b({target:"Object",stat:!0,forced:pb((function(){mw.f(1);}))},{getOwnPropertySymbols:function(t){return mw.f(Sw(t))}}),T_){var K_=!xw||pb((function(){var t=D_();return "[null]"!=T_([t])||"{}"!=T_({a:t})||"{}"!=T_(Object(t))}));$b({target:"JSON",stat:!0,forced:K_},{stringify:function(t,e,i){for(var n,o=[t],r=1;arguments.length>r;)o.push(arguments[r++]);if(n=e,(Mb(e)||void 0!==t)&&!W_(t))return Ow(e)||(e=function(t,e){if("function"==typeof n&&(e=n.call(this,t,e)),!W_(e))return e}),o[1]=e,T_.apply(null,o)}});}D_.prototype[O_]||Xb(D_.prototype,O_,D_.prototype.valueOf),s_(D_,"Symbol"),hw[x_]=!0;Wb.Object.getOwnPropertySymbols;var $_,J_,Q_,tk={},ek=!pb((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype})),ik=Iw("IE_PROTO"),nk=Object.prototype,ok=ek?Object.getPrototypeOf:function(t){return t=Sw(t),Tb(t,ik)?t[ik]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?nk:null},rk=(Uw("iterator"),!1);[].keys&&("next"in(Q_=[].keys())?(J_=ok(ok(Q_)))!==Object.prototype&&($_=J_):rk=!0),null==$_&&($_={});var sk={IteratorPrototype:$_,BUGGY_SAFARI_ITERATORS:rk},ak=sk.IteratorPrototype,hk=function(){return this},lk=(Object.setPrototypeOf||"__proto__"in{}&&function(){var t,e=!1,i={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(i,[]),e=i instanceof Array;}catch(t){}}(),sk.IteratorPrototype),dk=sk.BUGGY_SAFARI_ITERATORS,uk=Uw("iterator"),ck=function(){return this},fk=function(t,e,i,n,o,r,s){!function(t,e,i){var n=e+" Iterator";t.prototype=zw(ak,{next:bb(1,i)}),s_(t,n,!1,!0),tk[n]=hk;}(i,e,n);var a,h,l,d=function(t){if(t===o&&v)return v;if(!dk&&t in f)return f[t];switch(t){case"keys":case"values":case"entries":return function(){return new i(this,t)}}return function(){return new i(this)}},u=e+" Iterator",c=!1,f=t.prototype,p=f[uk]||f["@@iterator"]||o&&f[o],v=!dk&&p||d(o),y="Array"==e&&f.entries||p;if(y&&(a=ok(y.call(new t)),lk!==Object.prototype&&a.next&&(s_(a,u,!0,!0),tk[u]=ck)),"values"==o&&p&&"values"!==p.name&&(c=!0,v=function(){return p.call(this)}),s&&f[uk]!==v&&Xb(f,uk,v),tk[e]=v,o)if(h={values:d("values"),keys:r?v:d("keys"),entries:d("entries")},s)for(l in h)!dk&&!c&&l in f||Hw(f,l,h[l]);else $b({target:e,proto:!0,forced:dk||c},h);return h},pk=y_.set,vk=y_.getterFor("Array Iterator");fk(Array,"Array",(function(t,e){pk(this,{type:"Array Iterator",target:Sb(t),index:0,kind:e});}),(function(){var t=vk(this),e=t.target,i=t.kind,n=t.index++;return !e||n>=e.length?(t.target=void 0,{value:void 0,done:!0}):"keys"==i?{value:n,done:!1}:"values"==i?{value:e[n],done:!1}:{value:[n,e[n]],done:!1}}),"values");tk.Arguments=tk.Array;var yk=Uw("toStringTag");for(var gk in {CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}){var mk=fb[gk],bk=mk&&mk.prototype;bk&&!bk[yk]&&Xb(bk,yk,gk),tk[gk]=tk.Array;}var wk=function(t){return function(e,i){var n,o,r=String(Ob(e)),s=tw(i),a=r.length;return s<0||s>=a?t?"":void 0:(n=r.charCodeAt(s))<55296||n>56319||s+1===a||(o=r.charCodeAt(s+1))<56320||o>57343?t?r.charAt(s):n:t?r.slice(s,s+2):o-56320+(n-55296<<10)+65536}},_k={codeAt:wk(!1),charAt:wk(!0)}.charAt,kk=y_.set,xk=y_.getterFor("String Iterator");fk(String,"String",(function(t){kk(this,{type:"String Iterator",string:String(t),index:0});}),(function(){var t,e=xk(this),i=e.string,n=e.index;return n>=i.length?{value:void 0,done:!0}:(t=_k(i,n),e.index+=t.length,{value:t,done:!1})}));var Ok=Uw("iterator"),Sk=function(t){if(null!=t)return t[Ok]||t["@@iterator"]||tk[$w(t)]};$b({target:"Object",stat:!0,sham:!vb},{create:zw});var Mk=pb((function(){cw(1);}));$b({target:"Object",stat:!0,forced:Mk},{keys:function(t){return cw(Sw(t))}});Wb.Object.keys;var Ek="\t\n\v\f\r                　\u2028\u2029\ufeff",Dk="["+Ek+"]",Tk=RegExp("^"+Dk+Dk+"*"),Ck=RegExp(Dk+Dk+"*$"),Pk=function(t){return function(e){var i=String(Ob(e));return 1&t&&(i=i.replace(Tk,"")),2&t&&(i=i.replace(Ck,"")),i}},Ak={start:Pk(1),end:Pk(2),trim:Pk(3)},Ik=Ak.trim;$b({target:"String",proto:!0,forced:function(t){return pb((function(){return !!Ek[t]()||"​᠎"!="​᠎"[t]()||Ek[t].name!==t}))}("trim")},{trim:function(){return Ik(this)}});var Fk=function(t){return Wb[t+"Prototype"]},Nk=(Fk("String").trim,function(t,e){var i=[][t];return !i||!pb((function(){i.call(null,e||function(){throw 1},1);}))}),jk=__.forEach,zk=Nk("forEach")?function(t){return jk(this,t,arguments.length>1?arguments[1]:void 0)}:[].forEach;$b({target:"Array",proto:!0,forced:[].forEach!=zk},{forEach:zk});Fk("Array").forEach;var Lk,Rk,Bk=vw("navigator","userAgent")||"",Yk=fb.process,Hk=Yk&&Yk.versions,Wk=Hk&&Hk.v8;Wk?Rk=(Lk=Wk.split("."))[0]+Lk[1]:Bk&&(!(Lk=Bk.match(/Edge\/(\d+)/))||Lk[1]>=74)&&(Lk=Bk.match(/Chrome\/(\d+)/))&&(Rk=Lk[1]);var Vk=Rk&&+Rk,Uk=Uw("species"),Gk=function(t){return Vk>=51||!pb((function(){var e=[];return (e.constructor={})[Uk]=function(){return {foo:1}},1!==e[t](Boolean).foo}))},qk=__.map;$b({target:"Array",proto:!0,forced:!Gk("map")},{map:function(t){return qk(this,t,arguments.length>1?arguments[1]:void 0)}});Fk("Array").map;var Xk=Ak.trim,Zk=fb.parseInt,Kk=/^[+-]?0[Xx]/,$k=8!==Zk(Ek+"08")||22!==Zk(Ek+"0x16")?function(t,e){var i=Xk(String(t));return Zk(i,e>>>0||(Kk.test(i)?16:10))}:Zk;$b({global:!0,forced:parseInt!=$k},{parseInt:$k});var Jk=mb.f,Qk=function(t){return function(e){for(var i,n=Sb(e),o=cw(n),r=o.length,s=0,a=[];r>s;)i=o[s++],vb&&!Jk.call(n,i)||a.push(t?[i,n[i]]:n[i]);return a}},tx={entries:Qk(!0),values:Qk(!1)}.values;$b({target:"Object",stat:!0},{values:function(t){return tx(t)}});Wb.Object.values;var ex=__.filter;$b({target:"Array",proto:!0,forced:!Gk("filter")},{filter:function(t){return ex(this,t,arguments.length>1?arguments[1]:void 0)}});Fk("Array").filter;var ix=Uw("isConcatSpreadable"),nx=Vk>=51||!pb((function(){var t=[];return t[ix]=!1,t.concat()[0]!==t})),ox=Gk("concat"),rx=function(t){if(!Mb(t))return !1;var e=t[ix];return void 0!==e?!!e:Ow(t)};$b({target:"Array",proto:!0,forced:!nx||!ox},{concat:function(t){var e,i,n,o,r,s=Sw(this),a=m_(s,0),h=0;for(e=-1,n=arguments.length;e<n;e++)if(r=-1===e?s:arguments[e],rx(r)){if(h+(o=iw(r.length))>9007199254740991)throw TypeError("Maximum allowed index exceeded");for(i=0;i<o;i++,h++)i in r&&ww(a,h,r[i]);}else{if(h>=9007199254740991)throw TypeError("Maximum allowed index exceeded");ww(a,h++,r);}return a.length=h,a}});Fk("Array").concat;$b({target:"Array",stat:!0},{isArray:Ow});var sx=Wb.Array.isArray,ax=function(t,e,i,n){try{return n?e(Ub(i)[0],i[1]):e(i)}catch(e){var o=t.return;throw void 0!==o&&Ub(o.call(t)),e}},hx=Uw("iterator"),lx=Array.prototype,dx=function(t){return void 0!==t&&(tk.Array===t||lx[hx]===t)},ux=Uw("iterator"),cx=!1;try{var fx=0,px={next:function(){return {done:!!fx++}},return:function(){cx=!0;}};px[ux]=function(){return this},Array.from(px,(function(){throw 2}));}catch(t){}var vx=!function(t,e){if(!e&&!cx)return !1;var i=!1;try{var n={};n[ux]=function(){return {next:function(){return {done:i=!0}}}},t(n);}catch(t){}return i}((function(t){Array.from(t);}));$b({target:"Array",stat:!0,forced:vx},{from:function(t){var e,i,n,o,r,s=Sw(t),a="function"==typeof this?this:Array,h=arguments.length,l=h>1?arguments[1]:void 0,d=void 0!==l,u=0,c=Sk(s);if(d&&(l=Vb(l,h>2?arguments[2]:void 0,2)),null==c||a==Array&&dx(c))for(i=new a(e=iw(s.length));e>u;u++)ww(i,u,d?l(s[u],u):s[u]);else for(r=(o=c.call(s)).next,i=new a;!(n=r.call(o)).done;u++)ww(i,u,d?ax(o,l,[n.value,u],!0):n.value);return i.length=u,i}});Wb.Array.from,Uw("iterator");var yx=Uw("species"),gx=[].slice,mx=Math.max;$b({target:"Array",proto:!0,forced:!Gk("slice")},{slice:function(t,e){var i,n,o,r=Sb(this),s=iw(r.length),a=rw(t,s),h=rw(void 0===e?s:e,s);if(Ow(r)&&("function"!=typeof(i=r.constructor)||i!==Array&&!Ow(i.prototype)?Mb(i)&&null===(i=i[yx])&&(i=void 0):i=void 0,i===Array||void 0===i))return gx.call(r,a,h);for(n=new(void 0===i?Array:i)(mx(h-a,0)),o=0;a<h;a++,o++)a in r&&ww(n,o,r[a]);return n.length=o,n}});var bx=Fk("Array").slice,wx=Array.prototype,_x=function(t){var e=t.slice;return t===wx||t instanceof Array&&e===wx.slice?bx:e},kx=pb((function(){ok(1);}));$b({target:"Object",stat:!0,forced:kx,sham:!ek},{getPrototypeOf:function(t){return ok(Sw(t))}});var xx=Wb.Object.getPrototypeOf,Ox=aw.indexOf,Sx=[].indexOf,Mx=!!Sx&&1/[1].indexOf(1,-0)<0,Ex=Nk("indexOf");$b({target:"Array",proto:!0,forced:Mx||Ex},{indexOf:function(t){return Mx?Sx.apply(this,arguments)||0:Ox(this,t,arguments.length>1?arguments[1]:void 0)}});Fk("Array").indexOf;var Dx=sx,Tx=Object.assign,Cx=!Tx||pb((function(){var t={},e={},i=Symbol();return t[i]=7,"abcdefghijklmnopqrst".split("").forEach((function(t){e[t]=t;})),7!=Tx({},t)[i]||"abcdefghijklmnopqrst"!=cw(Tx({},e)).join("")}))?function(t,e){for(var i=Sw(t),n=arguments.length,o=1,r=mw.f,s=mb.f;n>o;)for(var a,h=xb(arguments[o++]),l=r?cw(h).concat(r(h)):cw(h),d=l.length,u=0;d>u;)a=l[u++],vb&&!s.call(h,a)||(i[a]=h[a]);return i}:Tx;$b({target:"Object",stat:!0,forced:Object.assign!==Cx},{assign:Cx});Wb.Object.assign;Xw("iterator");var Px=Gw.f("iterator");Xw("asyncIterator"),Xw("hasInstance"),Xw("isConcatSpreadable"),Xw("match"),Xw("matchAll"),Xw("replace"),Xw("search"),Xw("species"),Xw("split"),Xw("toPrimitive"),Xw("toStringTag"),Xw("unscopables"),s_(Math,"Math",!0),s_(fb.JSON,"JSON",!0);var Ax=Wb.Symbol;Xw("asyncDispose"),Xw("dispose"),Xw("observable"),Xw("patternMatch"),Xw("replaceAll");for(var Ix=Ax,Fx=ub((function(t){function e(t){return (e="function"==typeof Ix&&"symbol"==typeof Px?function(t){return typeof t}:function(t){return t&&"function"==typeof Ix&&t.constructor===Ix&&t!==Ix.prototype?"symbol":typeof t})(t)}function i(n){return "function"==typeof Ix&&"symbol"===e(Px)?t.exports=i=function(t){return e(t)}:t.exports=i=function(t){return t&&"function"==typeof Ix&&t.constructor===Ix&&t!==Ix.prototype?"symbol":e(t)},i(n)}t.exports=i;})),Nx=[],jx=0;jx<256;jx++)Nx[jx]=(jx+256).toString(16).substr(1);for(var zx=function(){if("undefined"!=typeof crypto&&crypto.getRandomValues){var t=new Uint8Array(16);return function(){return crypto.getRandomValues(t),t}}var e=new Array(16);return function(){for(var t,i=0;i<16;i++)0==(3&i)&&(t=4294967296*Math.random()),e[i]=t>>>((3&i)<<3)&255;return e}}(),Lx=[],Rx=0;Rx<256;Rx++)Lx[Rx]=(Rx+256).toString(16).substr(1);var Bx=zx();Bx[0],Bx[1],Bx[2],Bx[3],Bx[4],Bx[5],Bx[6],Bx[7];function Yx(t){return t instanceof Number||"number"==typeof t}function Hx(t){return t instanceof String||"string"==typeof t}function Wx(t,e,i,n){var o=!1;!0===n&&(o=null===e[i]&&void 0!==t[i]),o?delete t[i]:t[i]=e[i];}function Vx(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=arguments.length>3&&void 0!==arguments[3]&&arguments[3];for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)||!0===i)if("object"===Fx(e[o])&&null!==e[o]&&xx(e[o])===Object.prototype)void 0===t[o]?t[o]=Vx({},e[o],i):"object"===Fx(t[o])&&null!==t[o]&&xx(t[o])===Object.prototype?Vx(t[o],e[o],i):Wx(t,e,o,n);else if(Dx(e[o])){var r;t[o]=_x(r=e[o]).call(r);}else Wx(t,e,o,n);return t}function Ux(t){var e=Fx(t);return "object"===e?null===t?"null":t instanceof Boolean?"Boolean":t instanceof Number?"Number":t instanceof String?"String":Dx(t)?"Array":t instanceof Date?"Date":"Object":"number"===e?"Number":"boolean"===e?"Boolean":"string"===e?"String":void 0===e?"undefined":e}var Gx=qc((function(t,e){t.exports=function(){var e,i;function n(){return e.apply(null,arguments)}function o(t){return t instanceof Array||"[object Array]"===Object.prototype.toString.call(t)}function r(t){return null!=t&&"[object Object]"===Object.prototype.toString.call(t)}function s(t){return void 0===t}function a(t){return "number"==typeof t||"[object Number]"===Object.prototype.toString.call(t)}function h(t){return t instanceof Date||"[object Date]"===Object.prototype.toString.call(t)}function l(t,e){var i,n=[];for(i=0;i<t.length;++i)n.push(e(t[i],i));return n}function d(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function u(t,e){for(var i in e)d(e,i)&&(t[i]=e[i]);return d(e,"toString")&&(t.toString=e.toString),d(e,"valueOf")&&(t.valueOf=e.valueOf),t}function c(t,e,i,n){return Ae(t,e,i,n,!0).utc()}function f(t){return null==t._pf&&(t._pf={empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1,parsedDateParts:[],meridiem:null,rfc2822:!1,weekdayMismatch:!1}),t._pf}function p(t){if(null==t._isValid){var e=f(t),n=i.call(e.parsedDateParts,(function(t){return null!=t})),o=!isNaN(t._d.getTime())&&e.overflow<0&&!e.empty&&!e.invalidMonth&&!e.invalidWeekday&&!e.weekdayMismatch&&!e.nullInput&&!e.invalidFormat&&!e.userInvalidated&&(!e.meridiem||e.meridiem&&n);if(t._strict&&(o=o&&0===e.charsLeftOver&&0===e.unusedTokens.length&&void 0===e.bigHour),null!=Object.isFrozen&&Object.isFrozen(t))return o;t._isValid=o;}return t._isValid}function v(t){var e=c(NaN);return null!=t?u(f(e),t):f(e).userInvalidated=!0,e}i=Array.prototype.some?Array.prototype.some:function(t){for(var e=Object(this),i=e.length>>>0,n=0;n<i;n++)if(n in e&&t.call(this,e[n],n,e))return !0;return !1};var y=n.momentProperties=[];function g(t,e){var i,n,o;if(s(e._isAMomentObject)||(t._isAMomentObject=e._isAMomentObject),s(e._i)||(t._i=e._i),s(e._f)||(t._f=e._f),s(e._l)||(t._l=e._l),s(e._strict)||(t._strict=e._strict),s(e._tzm)||(t._tzm=e._tzm),s(e._isUTC)||(t._isUTC=e._isUTC),s(e._offset)||(t._offset=e._offset),s(e._pf)||(t._pf=f(e)),s(e._locale)||(t._locale=e._locale),y.length>0)for(i=0;i<y.length;i++)s(o=e[n=y[i]])||(t[n]=o);return t}var m=!1;function b(t){g(this,t),this._d=new Date(null!=t._d?t._d.getTime():NaN),this.isValid()||(this._d=new Date(NaN)),!1===m&&(m=!0,n.updateOffset(this),m=!1);}function w(t){return t instanceof b||null!=t&&null!=t._isAMomentObject}function _(t){return t<0?Math.ceil(t)||0:Math.floor(t)}function k(t){var e=+t,i=0;return 0!==e&&isFinite(e)&&(i=_(e)),i}function x(t,e,i){var n,o=Math.min(t.length,e.length),r=Math.abs(t.length-e.length),s=0;for(n=0;n<o;n++)(i&&t[n]!==e[n]||!i&&k(t[n])!==k(e[n]))&&s++;return s+r}function O(t){!1===n.suppressDeprecationWarnings&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+t);}function S(t,e){var i=!0;return u((function(){if(null!=n.deprecationHandler&&n.deprecationHandler(null,t),i){for(var o,r=[],s=0;s<arguments.length;s++){if(o="","object"==typeof arguments[s]){for(var a in o+="\n["+s+"] ",arguments[0])o+=a+": "+arguments[0][a]+", ";o=o.slice(0,-2);}else o=arguments[s];r.push(o);}O(t+"\nArguments: "+Array.prototype.slice.call(r).join("")+"\n"+(new Error).stack),i=!1;}return e.apply(this,arguments)}),e)}var M,E={};function D(t,e){null!=n.deprecationHandler&&n.deprecationHandler(t,e),E[t]||(O(e),E[t]=!0);}function T(t){return t instanceof Function||"[object Function]"===Object.prototype.toString.call(t)}function C(t,e){var i,n=u({},t);for(i in e)d(e,i)&&(r(t[i])&&r(e[i])?(n[i]={},u(n[i],t[i]),u(n[i],e[i])):null!=e[i]?n[i]=e[i]:delete n[i]);for(i in t)d(t,i)&&!d(e,i)&&r(t[i])&&(n[i]=u({},n[i]));return n}function P(t){null!=t&&this.set(t);}n.suppressDeprecationWarnings=!1,n.deprecationHandler=null,M=Object.keys?Object.keys:function(t){var e,i=[];for(e in t)d(t,e)&&i.push(e);return i};var A={};function I(t,e){var i=t.toLowerCase();A[i]=A[i+"s"]=A[e]=t;}function F(t){return "string"==typeof t?A[t]||A[t.toLowerCase()]:void 0}function N(t){var e,i,n={};for(i in t)d(t,i)&&(e=F(i))&&(n[e]=t[i]);return n}var j={};function z(t,e){j[t]=e;}function L(t,e,i){var n=""+Math.abs(t),o=e-n.length;return (t>=0?i?"+":"":"-")+Math.pow(10,Math.max(0,o)).toString().substr(1)+n}var R=/(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,B=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,Y={},H={};function W(t,e,i,n){var o=n;"string"==typeof n&&(o=function(){return this[n]()}),t&&(H[t]=o),e&&(H[e[0]]=function(){return L(o.apply(this,arguments),e[1],e[2])}),i&&(H[i]=function(){return this.localeData().ordinal(o.apply(this,arguments),t)});}function V(t,e){return t.isValid()?(e=U(e,t.localeData()),Y[e]=Y[e]||function(t){var e,i,n,o=t.match(R);for(e=0,i=o.length;e<i;e++)H[o[e]]?o[e]=H[o[e]]:o[e]=(n=o[e]).match(/\[[\s\S]/)?n.replace(/^\[|\]$/g,""):n.replace(/\\/g,"");return function(e){var n,r="";for(n=0;n<i;n++)r+=T(o[n])?o[n].call(e,t):o[n];return r}}(e),Y[e](t)):t.localeData().invalidDate()}function U(t,e){var i=5;function n(t){return e.longDateFormat(t)||t}for(B.lastIndex=0;i>=0&&B.test(t);)t=t.replace(B,n),B.lastIndex=0,i-=1;return t}var G=/\d/,q=/\d\d/,X=/\d{3}/,Z=/\d{4}/,K=/[+-]?\d{6}/,$=/\d\d?/,J=/\d\d\d\d?/,Q=/\d\d\d\d\d\d?/,tt=/\d{1,3}/,et=/\d{1,4}/,it=/[+-]?\d{1,6}/,nt=/\d+/,ot=/[+-]?\d+/,rt=/Z|[+-]\d\d:?\d\d/gi,st=/Z|[+-]\d\d(?::?\d\d)?/gi,at=/[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,ht={};function lt(t,e,i){ht[t]=T(e)?e:function(t,n){return t&&i?i:e};}function dt(t,e){return d(ht,t)?ht[t](e._strict,e._locale):new RegExp(ut(t.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,(function(t,e,i,n,o){return e||i||n||o}))))}function ut(t){return t.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}var ct={};function ft(t,e){var i,n=e;for("string"==typeof t&&(t=[t]),a(e)&&(n=function(t,i){i[e]=k(t);}),i=0;i<t.length;i++)ct[t[i]]=n;}function pt(t,e){ft(t,(function(t,i,n,o){n._w=n._w||{},e(t,n._w,n,o);}));}function vt(t,e,i){null!=e&&d(ct,t)&&ct[t](e,i._a,i,t);}var yt=0,gt=1,mt=2,bt=3,wt=4,_t=5,kt=6,xt=7,Ot=8;function St(t){return Mt(t)?366:365}function Mt(t){return t%4==0&&t%100!=0||t%400==0}W("Y",0,0,(function(){var t=this.year();return t<=9999?""+t:"+"+t})),W(0,["YY",2],0,(function(){return this.year()%100})),W(0,["YYYY",4],0,"year"),W(0,["YYYYY",5],0,"year"),W(0,["YYYYYY",6,!0],0,"year"),I("year","y"),z("year",1),lt("Y",ot),lt("YY",$,q),lt("YYYY",et,Z),lt("YYYYY",it,K),lt("YYYYYY",it,K),ft(["YYYYY","YYYYYY"],yt),ft("YYYY",(function(t,e){e[yt]=2===t.length?n.parseTwoDigitYear(t):k(t);})),ft("YY",(function(t,e){e[yt]=n.parseTwoDigitYear(t);})),ft("Y",(function(t,e){e[yt]=parseInt(t,10);})),n.parseTwoDigitYear=function(t){return k(t)+(k(t)>68?1900:2e3)};var Et,Dt=Tt("FullYear",!0);function Tt(t,e){return function(i){return null!=i?(Pt(this,t,i),n.updateOffset(this,e),this):Ct(this,t)}}function Ct(t,e){return t.isValid()?t._d["get"+(t._isUTC?"UTC":"")+e]():NaN}function Pt(t,e,i){t.isValid()&&!isNaN(i)&&("FullYear"===e&&Mt(t.year())&&1===t.month()&&29===t.date()?t._d["set"+(t._isUTC?"UTC":"")+e](i,t.month(),At(i,t.month())):t._d["set"+(t._isUTC?"UTC":"")+e](i));}function At(t,e){if(isNaN(t)||isNaN(e))return NaN;var i=function(t,e){return (t%e+e)%e}(e,12);return t+=(e-i)/12,1===i?Mt(t)?29:28:31-i%7%2}Et=Array.prototype.indexOf?Array.prototype.indexOf:function(t){var e;for(e=0;e<this.length;++e)if(this[e]===t)return e;return -1},W("M",["MM",2],"Mo",(function(){return this.month()+1})),W("MMM",0,0,(function(t){return this.localeData().monthsShort(this,t)})),W("MMMM",0,0,(function(t){return this.localeData().months(this,t)})),I("month","M"),z("month",8),lt("M",$),lt("MM",$,q),lt("MMM",(function(t,e){return e.monthsShortRegex(t)})),lt("MMMM",(function(t,e){return e.monthsRegex(t)})),ft(["M","MM"],(function(t,e){e[gt]=k(t)-1;})),ft(["MMM","MMMM"],(function(t,e,i,n){var o=i._locale.monthsParse(t,n,i._strict);null!=o?e[gt]=o:f(i).invalidMonth=t;}));var It=/D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,Ft="January_February_March_April_May_June_July_August_September_October_November_December".split("_"),Nt="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");function jt(t,e,i){var n,o,r,s=t.toLocaleLowerCase();if(!this._monthsParse)for(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[],n=0;n<12;++n)r=c([2e3,n]),this._shortMonthsParse[n]=this.monthsShort(r,"").toLocaleLowerCase(),this._longMonthsParse[n]=this.months(r,"").toLocaleLowerCase();return i?"MMM"===e?-1!==(o=Et.call(this._shortMonthsParse,s))?o:null:-1!==(o=Et.call(this._longMonthsParse,s))?o:null:"MMM"===e?-1!==(o=Et.call(this._shortMonthsParse,s))?o:-1!==(o=Et.call(this._longMonthsParse,s))?o:null:-1!==(o=Et.call(this._longMonthsParse,s))?o:-1!==(o=Et.call(this._shortMonthsParse,s))?o:null}function zt(t,e){var i;if(!t.isValid())return t;if("string"==typeof e)if(/^\d+$/.test(e))e=k(e);else if(!a(e=t.localeData().monthsParse(e)))return t;return i=Math.min(t.date(),At(t.year(),e)),t._d["set"+(t._isUTC?"UTC":"")+"Month"](e,i),t}function Lt(t){return null!=t?(zt(this,t),n.updateOffset(this,!0),this):Ct(this,"Month")}var Rt=at,Bt=at;function Yt(){function t(t,e){return e.length-t.length}var e,i,n=[],o=[],r=[];for(e=0;e<12;e++)i=c([2e3,e]),n.push(this.monthsShort(i,"")),o.push(this.months(i,"")),r.push(this.months(i,"")),r.push(this.monthsShort(i,""));for(n.sort(t),o.sort(t),r.sort(t),e=0;e<12;e++)n[e]=ut(n[e]),o[e]=ut(o[e]);for(e=0;e<24;e++)r[e]=ut(r[e]);this._monthsRegex=new RegExp("^("+r.join("|")+")","i"),this._monthsShortRegex=this._monthsRegex,this._monthsStrictRegex=new RegExp("^("+o.join("|")+")","i"),this._monthsShortStrictRegex=new RegExp("^("+n.join("|")+")","i");}function Ht(t,e,i,n,o,r,s){var a;return t<100&&t>=0?(a=new Date(t+400,e,i,n,o,r,s),isFinite(a.getFullYear())&&a.setFullYear(t)):a=new Date(t,e,i,n,o,r,s),a}function Wt(t){var e;if(t<100&&t>=0){var i=Array.prototype.slice.call(arguments);i[0]=t+400,e=new Date(Date.UTC.apply(null,i)),isFinite(e.getUTCFullYear())&&e.setUTCFullYear(t);}else e=new Date(Date.UTC.apply(null,arguments));return e}function Vt(t,e,i){var n=7+e-i;return -(7+Wt(t,0,n).getUTCDay()-e)%7+n-1}function Ut(t,e,i,n,o){var r,s,a=1+7*(e-1)+(7+i-n)%7+Vt(t,n,o);return a<=0?s=St(r=t-1)+a:a>St(t)?(r=t+1,s=a-St(t)):(r=t,s=a),{year:r,dayOfYear:s}}function Gt(t,e,i){var n,o,r=Vt(t.year(),e,i),s=Math.floor((t.dayOfYear()-r-1)/7)+1;return s<1?n=s+qt(o=t.year()-1,e,i):s>qt(t.year(),e,i)?(n=s-qt(t.year(),e,i),o=t.year()+1):(o=t.year(),n=s),{week:n,year:o}}function qt(t,e,i){var n=Vt(t,e,i),o=Vt(t+1,e,i);return (St(t)-n+o)/7}function Xt(t,e){return t.slice(e,7).concat(t.slice(0,e))}W("w",["ww",2],"wo","week"),W("W",["WW",2],"Wo","isoWeek"),I("week","w"),I("isoWeek","W"),z("week",5),z("isoWeek",5),lt("w",$),lt("ww",$,q),lt("W",$),lt("WW",$,q),pt(["w","ww","W","WW"],(function(t,e,i,n){e[n.substr(0,1)]=k(t);})),W("d",0,"do","day"),W("dd",0,0,(function(t){return this.localeData().weekdaysMin(this,t)})),W("ddd",0,0,(function(t){return this.localeData().weekdaysShort(this,t)})),W("dddd",0,0,(function(t){return this.localeData().weekdays(this,t)})),W("e",0,0,"weekday"),W("E",0,0,"isoWeekday"),I("day","d"),I("weekday","e"),I("isoWeekday","E"),z("day",11),z("weekday",11),z("isoWeekday",11),lt("d",$),lt("e",$),lt("E",$),lt("dd",(function(t,e){return e.weekdaysMinRegex(t)})),lt("ddd",(function(t,e){return e.weekdaysShortRegex(t)})),lt("dddd",(function(t,e){return e.weekdaysRegex(t)})),pt(["dd","ddd","dddd"],(function(t,e,i,n){var o=i._locale.weekdaysParse(t,n,i._strict);null!=o?e.d=o:f(i).invalidWeekday=t;})),pt(["d","e","E"],(function(t,e,i,n){e[n]=k(t);}));var Zt="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),Kt="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),$t="Su_Mo_Tu_We_Th_Fr_Sa".split("_");function Jt(t,e,i){var n,o,r,s=t.toLocaleLowerCase();if(!this._weekdaysParse)for(this._weekdaysParse=[],this._shortWeekdaysParse=[],this._minWeekdaysParse=[],n=0;n<7;++n)r=c([2e3,1]).day(n),this._minWeekdaysParse[n]=this.weekdaysMin(r,"").toLocaleLowerCase(),this._shortWeekdaysParse[n]=this.weekdaysShort(r,"").toLocaleLowerCase(),this._weekdaysParse[n]=this.weekdays(r,"").toLocaleLowerCase();return i?"dddd"===e?-1!==(o=Et.call(this._weekdaysParse,s))?o:null:"ddd"===e?-1!==(o=Et.call(this._shortWeekdaysParse,s))?o:null:-1!==(o=Et.call(this._minWeekdaysParse,s))?o:null:"dddd"===e?-1!==(o=Et.call(this._weekdaysParse,s))?o:-1!==(o=Et.call(this._shortWeekdaysParse,s))?o:-1!==(o=Et.call(this._minWeekdaysParse,s))?o:null:"ddd"===e?-1!==(o=Et.call(this._shortWeekdaysParse,s))?o:-1!==(o=Et.call(this._weekdaysParse,s))?o:-1!==(o=Et.call(this._minWeekdaysParse,s))?o:null:-1!==(o=Et.call(this._minWeekdaysParse,s))?o:-1!==(o=Et.call(this._weekdaysParse,s))?o:-1!==(o=Et.call(this._shortWeekdaysParse,s))?o:null}var Qt=at,te=at,ee=at;function ie(){function t(t,e){return e.length-t.length}var e,i,n,o,r,s=[],a=[],h=[],l=[];for(e=0;e<7;e++)i=c([2e3,1]).day(e),n=this.weekdaysMin(i,""),o=this.weekdaysShort(i,""),r=this.weekdays(i,""),s.push(n),a.push(o),h.push(r),l.push(n),l.push(o),l.push(r);for(s.sort(t),a.sort(t),h.sort(t),l.sort(t),e=0;e<7;e++)a[e]=ut(a[e]),h[e]=ut(h[e]),l[e]=ut(l[e]);this._weekdaysRegex=new RegExp("^("+l.join("|")+")","i"),this._weekdaysShortRegex=this._weekdaysRegex,this._weekdaysMinRegex=this._weekdaysRegex,this._weekdaysStrictRegex=new RegExp("^("+h.join("|")+")","i"),this._weekdaysShortStrictRegex=new RegExp("^("+a.join("|")+")","i"),this._weekdaysMinStrictRegex=new RegExp("^("+s.join("|")+")","i");}function ne(){return this.hours()%12||12}function oe(t,e){W(t,0,0,(function(){return this.localeData().meridiem(this.hours(),this.minutes(),e)}));}function re(t,e){return e._meridiemParse}W("H",["HH",2],0,"hour"),W("h",["hh",2],0,ne),W("k",["kk",2],0,(function(){return this.hours()||24})),W("hmm",0,0,(function(){return ""+ne.apply(this)+L(this.minutes(),2)})),W("hmmss",0,0,(function(){return ""+ne.apply(this)+L(this.minutes(),2)+L(this.seconds(),2)})),W("Hmm",0,0,(function(){return ""+this.hours()+L(this.minutes(),2)})),W("Hmmss",0,0,(function(){return ""+this.hours()+L(this.minutes(),2)+L(this.seconds(),2)})),oe("a",!0),oe("A",!1),I("hour","h"),z("hour",13),lt("a",re),lt("A",re),lt("H",$),lt("h",$),lt("k",$),lt("HH",$,q),lt("hh",$,q),lt("kk",$,q),lt("hmm",J),lt("hmmss",Q),lt("Hmm",J),lt("Hmmss",Q),ft(["H","HH"],bt),ft(["k","kk"],(function(t,e,i){var n=k(t);e[bt]=24===n?0:n;})),ft(["a","A"],(function(t,e,i){i._isPm=i._locale.isPM(t),i._meridiem=t;})),ft(["h","hh"],(function(t,e,i){e[bt]=k(t),f(i).bigHour=!0;})),ft("hmm",(function(t,e,i){var n=t.length-2;e[bt]=k(t.substr(0,n)),e[wt]=k(t.substr(n)),f(i).bigHour=!0;})),ft("hmmss",(function(t,e,i){var n=t.length-4,o=t.length-2;e[bt]=k(t.substr(0,n)),e[wt]=k(t.substr(n,2)),e[_t]=k(t.substr(o)),f(i).bigHour=!0;})),ft("Hmm",(function(t,e,i){var n=t.length-2;e[bt]=k(t.substr(0,n)),e[wt]=k(t.substr(n));})),ft("Hmmss",(function(t,e,i){var n=t.length-4,o=t.length-2;e[bt]=k(t.substr(0,n)),e[wt]=k(t.substr(n,2)),e[_t]=k(t.substr(o));}));var se,ae=Tt("Hours",!0),he={calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},longDateFormat:{LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},invalidDate:"Invalid date",ordinal:"%d",dayOfMonthOrdinalParse:/\d{1,2}/,relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",ss:"%d seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},months:Ft,monthsShort:Nt,week:{dow:0,doy:6},weekdays:Zt,weekdaysMin:$t,weekdaysShort:Kt,meridiemParse:/[ap]\.?m?\.?/i},le={},de={};function ue(t){return t?t.toLowerCase().replace("_","-"):t}function ce(e){var i=null;if(!le[e]&&t&&t.exports)try{i=se._abbr,Gc(),fe(i);}catch(t){}return le[e]}function fe(t,e){var i;return t&&((i=s(e)?ve(t):pe(t,e))?se=i:"undefined"!=typeof console&&console.warn&&console.warn("Locale "+t+" not found. Did you forget to load it?")),se._abbr}function pe(t,e){if(null!==e){var i,n=he;if(e.abbr=t,null!=le[t])D("defineLocaleOverride","use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."),n=le[t]._config;else if(null!=e.parentLocale)if(null!=le[e.parentLocale])n=le[e.parentLocale]._config;else{if(null==(i=ce(e.parentLocale)))return de[e.parentLocale]||(de[e.parentLocale]=[]),de[e.parentLocale].push({name:t,config:e}),null;n=i._config;}return le[t]=new P(C(n,e)),de[t]&&de[t].forEach((function(t){pe(t.name,t.config);})),fe(t),le[t]}return delete le[t],null}function ve(t){var e;if(t&&t._locale&&t._locale._abbr&&(t=t._locale._abbr),!t)return se;if(!o(t)){if(e=ce(t))return e;t=[t];}return function(t){for(var e,i,n,o,r=0;r<t.length;){for(e=(o=ue(t[r]).split("-")).length,i=(i=ue(t[r+1]))?i.split("-"):null;e>0;){if(n=ce(o.slice(0,e).join("-")))return n;if(i&&i.length>=e&&x(o,i,!0)>=e-1)break;e--;}r++;}return se}(t)}function ye(t){var e,i=t._a;return i&&-2===f(t).overflow&&(e=i[gt]<0||i[gt]>11?gt:i[mt]<1||i[mt]>At(i[yt],i[gt])?mt:i[bt]<0||i[bt]>24||24===i[bt]&&(0!==i[wt]||0!==i[_t]||0!==i[kt])?bt:i[wt]<0||i[wt]>59?wt:i[_t]<0||i[_t]>59?_t:i[kt]<0||i[kt]>999?kt:-1,f(t)._overflowDayOfYear&&(e<yt||e>mt)&&(e=mt),f(t)._overflowWeeks&&-1===e&&(e=xt),f(t)._overflowWeekday&&-1===e&&(e=Ot),f(t).overflow=e),t}function ge(t,e,i){return null!=t?t:null!=e?e:i}function me(t){var e,i,o,r,s,a=[];if(!t._d){for(o=function(t){var e=new Date(n.now());return t._useUTC?[e.getUTCFullYear(),e.getUTCMonth(),e.getUTCDate()]:[e.getFullYear(),e.getMonth(),e.getDate()]}(t),t._w&&null==t._a[mt]&&null==t._a[gt]&&function(t){var e,i,n,o,r,s,a,h;if(null!=(e=t._w).GG||null!=e.W||null!=e.E)r=1,s=4,i=ge(e.GG,t._a[yt],Gt(Ie(),1,4).year),n=ge(e.W,1),((o=ge(e.E,1))<1||o>7)&&(h=!0);else{r=t._locale._week.dow,s=t._locale._week.doy;var l=Gt(Ie(),r,s);i=ge(e.gg,t._a[yt],l.year),n=ge(e.w,l.week),null!=e.d?((o=e.d)<0||o>6)&&(h=!0):null!=e.e?(o=e.e+r,(e.e<0||e.e>6)&&(h=!0)):o=r;}n<1||n>qt(i,r,s)?f(t)._overflowWeeks=!0:null!=h?f(t)._overflowWeekday=!0:(a=Ut(i,n,o,r,s),t._a[yt]=a.year,t._dayOfYear=a.dayOfYear);}(t),null!=t._dayOfYear&&(s=ge(t._a[yt],o[yt]),(t._dayOfYear>St(s)||0===t._dayOfYear)&&(f(t)._overflowDayOfYear=!0),i=Wt(s,0,t._dayOfYear),t._a[gt]=i.getUTCMonth(),t._a[mt]=i.getUTCDate()),e=0;e<3&&null==t._a[e];++e)t._a[e]=a[e]=o[e];for(;e<7;e++)t._a[e]=a[e]=null==t._a[e]?2===e?1:0:t._a[e];24===t._a[bt]&&0===t._a[wt]&&0===t._a[_t]&&0===t._a[kt]&&(t._nextDay=!0,t._a[bt]=0),t._d=(t._useUTC?Wt:Ht).apply(null,a),r=t._useUTC?t._d.getUTCDay():t._d.getDay(),null!=t._tzm&&t._d.setUTCMinutes(t._d.getUTCMinutes()-t._tzm),t._nextDay&&(t._a[bt]=24),t._w&&void 0!==t._w.d&&t._w.d!==r&&(f(t).weekdayMismatch=!0);}}var be=/^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,we=/^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,_e=/Z|[+-]\d\d(?::?\d\d)?/,ke=[["YYYYYY-MM-DD",/[+-]\d{6}-\d\d-\d\d/],["YYYY-MM-DD",/\d{4}-\d\d-\d\d/],["GGGG-[W]WW-E",/\d{4}-W\d\d-\d/],["GGGG-[W]WW",/\d{4}-W\d\d/,!1],["YYYY-DDD",/\d{4}-\d{3}/],["YYYY-MM",/\d{4}-\d\d/,!1],["YYYYYYMMDD",/[+-]\d{10}/],["YYYYMMDD",/\d{8}/],["GGGG[W]WWE",/\d{4}W\d{3}/],["GGGG[W]WW",/\d{4}W\d{2}/,!1],["YYYYDDD",/\d{7}/]],xe=[["HH:mm:ss.SSSS",/\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss,SSSS",/\d\d:\d\d:\d\d,\d+/],["HH:mm:ss",/\d\d:\d\d:\d\d/],["HH:mm",/\d\d:\d\d/],["HHmmss.SSSS",/\d\d\d\d\d\d\.\d+/],["HHmmss,SSSS",/\d\d\d\d\d\d,\d+/],["HHmmss",/\d\d\d\d\d\d/],["HHmm",/\d\d\d\d/],["HH",/\d\d/]],Oe=/^\/?Date\((\-?\d+)/i;function Se(t){var e,i,n,o,r,s,a=t._i,h=be.exec(a)||we.exec(a);if(h){for(f(t).iso=!0,e=0,i=ke.length;e<i;e++)if(ke[e][1].exec(h[1])){o=ke[e][0],n=!1!==ke[e][2];break}if(null==o)return void(t._isValid=!1);if(h[3]){for(e=0,i=xe.length;e<i;e++)if(xe[e][1].exec(h[3])){r=(h[2]||" ")+xe[e][0];break}if(null==r)return void(t._isValid=!1)}if(!n&&null!=r)return void(t._isValid=!1);if(h[4]){if(!_e.exec(h[4]))return void(t._isValid=!1);s="Z";}t._f=o+(r||"")+(s||""),Ce(t);}else t._isValid=!1;}var Me=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;function Ee(t){var e=parseInt(t,10);return e<=49?2e3+e:e<=999?1900+e:e}var De={UT:0,GMT:0,EDT:-240,EST:-300,CDT:-300,CST:-360,MDT:-360,MST:-420,PDT:-420,PST:-480};function Te(t){var e,i,n,o,r,s,a,h=Me.exec(t._i.replace(/\([^)]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").replace(/^\s\s*/,"").replace(/\s\s*$/,""));if(h){var l=(e=h[4],i=h[3],n=h[2],o=h[5],r=h[6],s=h[7],a=[Ee(e),Nt.indexOf(i),parseInt(n,10),parseInt(o,10),parseInt(r,10)],s&&a.push(parseInt(s,10)),a);if(!function(t,e,i){return !t||Kt.indexOf(t)===new Date(e[0],e[1],e[2]).getDay()||(f(i).weekdayMismatch=!0,i._isValid=!1,!1)}(h[1],l,t))return;t._a=l,t._tzm=function(t,e,i){if(t)return De[t];if(e)return 0;var n=parseInt(i,10),o=n%100;return (n-o)/100*60+o}(h[8],h[9],h[10]),t._d=Wt.apply(null,t._a),t._d.setUTCMinutes(t._d.getUTCMinutes()-t._tzm),f(t).rfc2822=!0;}else t._isValid=!1;}function Ce(t){if(t._f!==n.ISO_8601)if(t._f!==n.RFC_2822){t._a=[],f(t).empty=!0;var e,i,o,r,s,a=""+t._i,h=a.length,l=0;for(o=U(t._f,t._locale).match(R)||[],e=0;e<o.length;e++)r=o[e],(i=(a.match(dt(r,t))||[])[0])&&((s=a.substr(0,a.indexOf(i))).length>0&&f(t).unusedInput.push(s),a=a.slice(a.indexOf(i)+i.length),l+=i.length),H[r]?(i?f(t).empty=!1:f(t).unusedTokens.push(r),vt(r,i,t)):t._strict&&!i&&f(t).unusedTokens.push(r);f(t).charsLeftOver=h-l,a.length>0&&f(t).unusedInput.push(a),t._a[bt]<=12&&!0===f(t).bigHour&&t._a[bt]>0&&(f(t).bigHour=void 0),f(t).parsedDateParts=t._a.slice(0),f(t).meridiem=t._meridiem,t._a[bt]=function(t,e,i){var n;return null==i?e:null!=t.meridiemHour?t.meridiemHour(e,i):null!=t.isPM?((n=t.isPM(i))&&e<12&&(e+=12),n||12!==e||(e=0),e):e}(t._locale,t._a[bt],t._meridiem),me(t),ye(t);}else Te(t);else Se(t);}function Pe(t){var e=t._i,i=t._f;return t._locale=t._locale||ve(t._l),null===e||void 0===i&&""===e?v({nullInput:!0}):("string"==typeof e&&(t._i=e=t._locale.preparse(e)),w(e)?new b(ye(e)):(h(e)?t._d=e:o(i)?function(t){var e,i,n,o,r;if(0===t._f.length)return f(t).invalidFormat=!0,void(t._d=new Date(NaN));for(o=0;o<t._f.length;o++)r=0,e=g({},t),null!=t._useUTC&&(e._useUTC=t._useUTC),e._f=t._f[o],Ce(e),p(e)&&(r+=f(e).charsLeftOver,r+=10*f(e).unusedTokens.length,f(e).score=r,(null==n||r<n)&&(n=r,i=e));u(t,i||e);}(t):i?Ce(t):function(t){var e=t._i;s(e)?t._d=new Date(n.now()):h(e)?t._d=new Date(e.valueOf()):"string"==typeof e?function(t){var e=Oe.exec(t._i);null===e?(Se(t),!1===t._isValid&&(delete t._isValid,Te(t),!1===t._isValid&&(delete t._isValid,n.createFromInputFallback(t)))):t._d=new Date(+e[1]);}(t):o(e)?(t._a=l(e.slice(0),(function(t){return parseInt(t,10)})),me(t)):r(e)?function(t){if(!t._d){var e=N(t._i);t._a=l([e.year,e.month,e.day||e.date,e.hour,e.minute,e.second,e.millisecond],(function(t){return t&&parseInt(t,10)})),me(t);}}(t):a(e)?t._d=new Date(e):n.createFromInputFallback(t);}(t),p(t)||(t._d=null),t))}function Ae(t,e,i,n,s){var a,h={};return !0!==i&&!1!==i||(n=i,i=void 0),(r(t)&&function(t){if(Object.getOwnPropertyNames)return 0===Object.getOwnPropertyNames(t).length;var e;for(e in t)if(t.hasOwnProperty(e))return !1;return !0}(t)||o(t)&&0===t.length)&&(t=void 0),h._isAMomentObject=!0,h._useUTC=h._isUTC=s,h._l=i,h._i=t,h._f=e,h._strict=n,(a=new b(ye(Pe(h))))._nextDay&&(a.add(1,"d"),a._nextDay=void 0),a}function Ie(t,e,i,n){return Ae(t,e,i,n,!1)}n.createFromInputFallback=S("value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.",(function(t){t._d=new Date(t._i+(t._useUTC?" UTC":""));})),n.ISO_8601=function(){},n.RFC_2822=function(){};var Fe=S("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/",(function(){var t=Ie.apply(null,arguments);return this.isValid()&&t.isValid()?t<this?this:t:v()})),Ne=S("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/",(function(){var t=Ie.apply(null,arguments);return this.isValid()&&t.isValid()?t>this?this:t:v()}));function je(t,e){var i,n;if(1===e.length&&o(e[0])&&(e=e[0]),!e.length)return Ie();for(i=e[0],n=1;n<e.length;++n)e[n].isValid()&&!e[n][t](i)||(i=e[n]);return i}var ze=["year","quarter","month","week","day","hour","minute","second","millisecond"];function Le(t){var e=N(t),i=e.year||0,n=e.quarter||0,o=e.month||0,r=e.week||e.isoWeek||0,s=e.day||0,a=e.hour||0,h=e.minute||0,l=e.second||0,d=e.millisecond||0;this._isValid=function(t){for(var e in t)if(-1===Et.call(ze,e)||null!=t[e]&&isNaN(t[e]))return !1;for(var i=!1,n=0;n<ze.length;++n)if(t[ze[n]]){if(i)return !1;parseFloat(t[ze[n]])!==k(t[ze[n]])&&(i=!0);}return !0}(e),this._milliseconds=+d+1e3*l+6e4*h+1e3*a*60*60,this._days=+s+7*r,this._months=+o+3*n+12*i,this._data={},this._locale=ve(),this._bubble();}function Re(t){return t instanceof Le}function Be(t){return t<0?-1*Math.round(-1*t):Math.round(t)}function Ye(t,e){W(t,0,0,(function(){var t=this.utcOffset(),i="+";return t<0&&(t=-t,i="-"),i+L(~~(t/60),2)+e+L(~~t%60,2)}));}Ye("Z",":"),Ye("ZZ",""),lt("Z",st),lt("ZZ",st),ft(["Z","ZZ"],(function(t,e,i){i._useUTC=!0,i._tzm=We(st,t);}));var He=/([\+\-]|\d\d)/gi;function We(t,e){var i=(e||"").match(t);if(null===i)return null;var n=((i[i.length-1]||[])+"").match(He)||["-",0,0],o=60*n[1]+k(n[2]);return 0===o?0:"+"===n[0]?o:-o}function Ve(t,e){var i,o;return e._isUTC?(i=e.clone(),o=(w(t)||h(t)?t.valueOf():Ie(t).valueOf())-i.valueOf(),i._d.setTime(i._d.valueOf()+o),n.updateOffset(i,!1),i):Ie(t).local()}function Ue(t){return 15*-Math.round(t._d.getTimezoneOffset()/15)}function Ge(){return !!this.isValid()&&this._isUTC&&0===this._offset}n.updateOffset=function(){};var qe=/^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/,Xe=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;function Ze(t,e){var i,n,o,r,s,h,l=t,u=null;return Re(t)?l={ms:t._milliseconds,d:t._days,M:t._months}:a(t)?(l={},e?l[e]=t:l.milliseconds=t):(u=qe.exec(t))?(i="-"===u[1]?-1:1,l={y:0,d:k(u[mt])*i,h:k(u[bt])*i,m:k(u[wt])*i,s:k(u[_t])*i,ms:k(Be(1e3*u[kt]))*i}):(u=Xe.exec(t))?(i="-"===u[1]?-1:1,l={y:Ke(u[2],i),M:Ke(u[3],i),w:Ke(u[4],i),d:Ke(u[5],i),h:Ke(u[6],i),m:Ke(u[7],i),s:Ke(u[8],i)}):null==l?l={}:"object"==typeof l&&("from"in l||"to"in l)&&(r=Ie(l.from),s=Ie(l.to),o=r.isValid()&&s.isValid()?(s=Ve(s,r),r.isBefore(s)?h=$e(r,s):((h=$e(s,r)).milliseconds=-h.milliseconds,h.months=-h.months),h):{milliseconds:0,months:0},(l={}).ms=o.milliseconds,l.M=o.months),n=new Le(l),Re(t)&&d(t,"_locale")&&(n._locale=t._locale),n}function Ke(t,e){var i=t&&parseFloat(t.replace(",","."));return (isNaN(i)?0:i)*e}function $e(t,e){var i={};return i.months=e.month()-t.month()+12*(e.year()-t.year()),t.clone().add(i.months,"M").isAfter(e)&&--i.months,i.milliseconds=+e-+t.clone().add(i.months,"M"),i}function Je(t,e){return function(i,n){var o;return null===n||isNaN(+n)||(D(e,"moment()."+e+"(period, number) is deprecated. Please use moment()."+e+"(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."),o=i,i=n,n=o),Qe(this,Ze(i="string"==typeof i?+i:i,n),t),this}}function Qe(t,e,i,o){var r=e._milliseconds,s=Be(e._days),a=Be(e._months);t.isValid()&&(o=null==o||o,a&&zt(t,Ct(t,"Month")+a*i),s&&Pt(t,"Date",Ct(t,"Date")+s*i),r&&t._d.setTime(t._d.valueOf()+r*i),o&&n.updateOffset(t,s||a));}Ze.fn=Le.prototype,Ze.invalid=function(){return Ze(NaN)};var ti=Je(1,"add"),ei=Je(-1,"subtract");function ii(t,e){var i=12*(e.year()-t.year())+(e.month()-t.month()),n=t.clone().add(i,"months");return -(i+(e-n<0?(e-n)/(n-t.clone().add(i-1,"months")):(e-n)/(t.clone().add(i+1,"months")-n)))||0}function ni(t){var e;return void 0===t?this._locale._abbr:(null!=(e=ve(t))&&(this._locale=e),this)}n.defaultFormat="YYYY-MM-DDTHH:mm:ssZ",n.defaultFormatUtc="YYYY-MM-DDTHH:mm:ss[Z]";var oi=S("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",(function(t){return void 0===t?this.localeData():this.locale(t)}));function ri(){return this._locale}var si=1e3,ai=60*si,hi=60*ai,li=3506328*hi;function di(t,e){return (t%e+e)%e}function ui(t,e,i){return t<100&&t>=0?new Date(t+400,e,i)-li:new Date(t,e,i).valueOf()}function ci(t,e,i){return t<100&&t>=0?Date.UTC(t+400,e,i)-li:Date.UTC(t,e,i)}function fi(t,e){W(0,[t,t.length],0,e);}function pi(t,e,i,n,o){var r;return null==t?Gt(this,n,o).year:(e>(r=qt(t,n,o))&&(e=r),vi.call(this,t,e,i,n,o))}function vi(t,e,i,n,o){var r=Ut(t,e,i,n,o),s=Wt(r.year,0,r.dayOfYear);return this.year(s.getUTCFullYear()),this.month(s.getUTCMonth()),this.date(s.getUTCDate()),this}W(0,["gg",2],0,(function(){return this.weekYear()%100})),W(0,["GG",2],0,(function(){return this.isoWeekYear()%100})),fi("gggg","weekYear"),fi("ggggg","weekYear"),fi("GGGG","isoWeekYear"),fi("GGGGG","isoWeekYear"),I("weekYear","gg"),I("isoWeekYear","GG"),z("weekYear",1),z("isoWeekYear",1),lt("G",ot),lt("g",ot),lt("GG",$,q),lt("gg",$,q),lt("GGGG",et,Z),lt("gggg",et,Z),lt("GGGGG",it,K),lt("ggggg",it,K),pt(["gggg","ggggg","GGGG","GGGGG"],(function(t,e,i,n){e[n.substr(0,2)]=k(t);})),pt(["gg","GG"],(function(t,e,i,o){e[o]=n.parseTwoDigitYear(t);})),W("Q",0,"Qo","quarter"),I("quarter","Q"),z("quarter",7),lt("Q",G),ft("Q",(function(t,e){e[gt]=3*(k(t)-1);})),W("D",["DD",2],"Do","date"),I("date","D"),z("date",9),lt("D",$),lt("DD",$,q),lt("Do",(function(t,e){return t?e._dayOfMonthOrdinalParse||e._ordinalParse:e._dayOfMonthOrdinalParseLenient})),ft(["D","DD"],mt),ft("Do",(function(t,e){e[mt]=k(t.match($)[0]);}));var yi=Tt("Date",!0);W("DDD",["DDDD",3],"DDDo","dayOfYear"),I("dayOfYear","DDD"),z("dayOfYear",4),lt("DDD",tt),lt("DDDD",X),ft(["DDD","DDDD"],(function(t,e,i){i._dayOfYear=k(t);})),W("m",["mm",2],0,"minute"),I("minute","m"),z("minute",14),lt("m",$),lt("mm",$,q),ft(["m","mm"],wt);var gi=Tt("Minutes",!1);W("s",["ss",2],0,"second"),I("second","s"),z("second",15),lt("s",$),lt("ss",$,q),ft(["s","ss"],_t);var mi,bi=Tt("Seconds",!1);for(W("S",0,0,(function(){return ~~(this.millisecond()/100)})),W(0,["SS",2],0,(function(){return ~~(this.millisecond()/10)})),W(0,["SSS",3],0,"millisecond"),W(0,["SSSS",4],0,(function(){return 10*this.millisecond()})),W(0,["SSSSS",5],0,(function(){return 100*this.millisecond()})),W(0,["SSSSSS",6],0,(function(){return 1e3*this.millisecond()})),W(0,["SSSSSSS",7],0,(function(){return 1e4*this.millisecond()})),W(0,["SSSSSSSS",8],0,(function(){return 1e5*this.millisecond()})),W(0,["SSSSSSSSS",9],0,(function(){return 1e6*this.millisecond()})),I("millisecond","ms"),z("millisecond",16),lt("S",tt,G),lt("SS",tt,q),lt("SSS",tt,X),mi="SSSS";mi.length<=9;mi+="S")lt(mi,nt);function wi(t,e){e[kt]=k(1e3*("0."+t));}for(mi="S";mi.length<=9;mi+="S")ft(mi,wi);var _i=Tt("Milliseconds",!1);W("z",0,0,"zoneAbbr"),W("zz",0,0,"zoneName");var ki=b.prototype;function xi(t){return t}ki.add=ti,ki.calendar=function(t,e){var i=t||Ie(),o=Ve(i,this).startOf("day"),r=n.calendarFormat(this,o)||"sameElse",s=e&&(T(e[r])?e[r].call(this,i):e[r]);return this.format(s||this.localeData().calendar(r,this,Ie(i)))},ki.clone=function(){return new b(this)},ki.diff=function(t,e,i){var n,o,r;if(!this.isValid())return NaN;if(!(n=Ve(t,this)).isValid())return NaN;switch(o=6e4*(n.utcOffset()-this.utcOffset()),e=F(e)){case"year":r=ii(this,n)/12;break;case"month":r=ii(this,n);break;case"quarter":r=ii(this,n)/3;break;case"second":r=(this-n)/1e3;break;case"minute":r=(this-n)/6e4;break;case"hour":r=(this-n)/36e5;break;case"day":r=(this-n-o)/864e5;break;case"week":r=(this-n-o)/6048e5;break;default:r=this-n;}return i?r:_(r)},ki.endOf=function(t){var e;if(void 0===(t=F(t))||"millisecond"===t||!this.isValid())return this;var i=this._isUTC?ci:ui;switch(t){case"year":e=i(this.year()+1,0,1)-1;break;case"quarter":e=i(this.year(),this.month()-this.month()%3+3,1)-1;break;case"month":e=i(this.year(),this.month()+1,1)-1;break;case"week":e=i(this.year(),this.month(),this.date()-this.weekday()+7)-1;break;case"isoWeek":e=i(this.year(),this.month(),this.date()-(this.isoWeekday()-1)+7)-1;break;case"day":case"date":e=i(this.year(),this.month(),this.date()+1)-1;break;case"hour":e=this._d.valueOf(),e+=hi-di(e+(this._isUTC?0:this.utcOffset()*ai),hi)-1;break;case"minute":e=this._d.valueOf(),e+=ai-di(e,ai)-1;break;case"second":e=this._d.valueOf(),e+=si-di(e,si)-1;}return this._d.setTime(e),n.updateOffset(this,!0),this},ki.format=function(t){t||(t=this.isUtc()?n.defaultFormatUtc:n.defaultFormat);var e=V(this,t);return this.localeData().postformat(e)},ki.from=function(t,e){return this.isValid()&&(w(t)&&t.isValid()||Ie(t).isValid())?Ze({to:this,from:t}).locale(this.locale()).humanize(!e):this.localeData().invalidDate()},ki.fromNow=function(t){return this.from(Ie(),t)},ki.to=function(t,e){return this.isValid()&&(w(t)&&t.isValid()||Ie(t).isValid())?Ze({from:this,to:t}).locale(this.locale()).humanize(!e):this.localeData().invalidDate()},ki.toNow=function(t){return this.to(Ie(),t)},ki.get=function(t){return T(this[t=F(t)])?this[t]():this},ki.invalidAt=function(){return f(this).overflow},ki.isAfter=function(t,e){var i=w(t)?t:Ie(t);return !(!this.isValid()||!i.isValid())&&("millisecond"===(e=F(e)||"millisecond")?this.valueOf()>i.valueOf():i.valueOf()<this.clone().startOf(e).valueOf())},ki.isBefore=function(t,e){var i=w(t)?t:Ie(t);return !(!this.isValid()||!i.isValid())&&("millisecond"===(e=F(e)||"millisecond")?this.valueOf()<i.valueOf():this.clone().endOf(e).valueOf()<i.valueOf())},ki.isBetween=function(t,e,i,n){var o=w(t)?t:Ie(t),r=w(e)?e:Ie(e);return !!(this.isValid()&&o.isValid()&&r.isValid())&&("("===(n=n||"()")[0]?this.isAfter(o,i):!this.isBefore(o,i))&&(")"===n[1]?this.isBefore(r,i):!this.isAfter(r,i))},ki.isSame=function(t,e){var i,n=w(t)?t:Ie(t);return !(!this.isValid()||!n.isValid())&&("millisecond"===(e=F(e)||"millisecond")?this.valueOf()===n.valueOf():(i=n.valueOf(),this.clone().startOf(e).valueOf()<=i&&i<=this.clone().endOf(e).valueOf()))},ki.isSameOrAfter=function(t,e){return this.isSame(t,e)||this.isAfter(t,e)},ki.isSameOrBefore=function(t,e){return this.isSame(t,e)||this.isBefore(t,e)},ki.isValid=function(){return p(this)},ki.lang=oi,ki.locale=ni,ki.localeData=ri,ki.max=Ne,ki.min=Fe,ki.parsingFlags=function(){return u({},f(this))},ki.set=function(t,e){if("object"==typeof t)for(var i=function(t){var e=[];for(var i in t)e.push({unit:i,priority:j[i]});return e.sort((function(t,e){return t.priority-e.priority})),e}(t=N(t)),n=0;n<i.length;n++)this[i[n].unit](t[i[n].unit]);else if(T(this[t=F(t)]))return this[t](e);return this},ki.startOf=function(t){var e;if(void 0===(t=F(t))||"millisecond"===t||!this.isValid())return this;var i=this._isUTC?ci:ui;switch(t){case"year":e=i(this.year(),0,1);break;case"quarter":e=i(this.year(),this.month()-this.month()%3,1);break;case"month":e=i(this.year(),this.month(),1);break;case"week":e=i(this.year(),this.month(),this.date()-this.weekday());break;case"isoWeek":e=i(this.year(),this.month(),this.date()-(this.isoWeekday()-1));break;case"day":case"date":e=i(this.year(),this.month(),this.date());break;case"hour":e=this._d.valueOf(),e-=di(e+(this._isUTC?0:this.utcOffset()*ai),hi);break;case"minute":e=this._d.valueOf(),e-=di(e,ai);break;case"second":e=this._d.valueOf(),e-=di(e,si);}return this._d.setTime(e),n.updateOffset(this,!0),this},ki.subtract=ei,ki.toArray=function(){var t=this;return [t.year(),t.month(),t.date(),t.hour(),t.minute(),t.second(),t.millisecond()]},ki.toObject=function(){var t=this;return {years:t.year(),months:t.month(),date:t.date(),hours:t.hours(),minutes:t.minutes(),seconds:t.seconds(),milliseconds:t.milliseconds()}},ki.toDate=function(){return new Date(this.valueOf())},ki.toISOString=function(t){if(!this.isValid())return null;var e=!0!==t,i=e?this.clone().utc():this;return i.year()<0||i.year()>9999?V(i,e?"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYYYY-MM-DD[T]HH:mm:ss.SSSZ"):T(Date.prototype.toISOString)?e?this.toDate().toISOString():new Date(this.valueOf()+60*this.utcOffset()*1e3).toISOString().replace("Z",V(i,"Z")):V(i,e?"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYY-MM-DD[T]HH:mm:ss.SSSZ")},ki.inspect=function(){if(!this.isValid())return "moment.invalid(/* "+this._i+" */)";var t="moment",e="";this.isLocal()||(t=0===this.utcOffset()?"moment.utc":"moment.parseZone",e="Z");var i="["+t+'("]',n=0<=this.year()&&this.year()<=9999?"YYYY":"YYYYYY",o=e+'[")]';return this.format(i+n+"-MM-DD[T]HH:mm:ss.SSS"+o)},ki.toJSON=function(){return this.isValid()?this.toISOString():null},ki.toString=function(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},ki.unix=function(){return Math.floor(this.valueOf()/1e3)},ki.valueOf=function(){return this._d.valueOf()-6e4*(this._offset||0)},ki.creationData=function(){return {input:this._i,format:this._f,locale:this._locale,isUTC:this._isUTC,strict:this._strict}},ki.year=Dt,ki.isLeapYear=function(){return Mt(this.year())},ki.weekYear=function(t){return pi.call(this,t,this.week(),this.weekday(),this.localeData()._week.dow,this.localeData()._week.doy)},ki.isoWeekYear=function(t){return pi.call(this,t,this.isoWeek(),this.isoWeekday(),1,4)},ki.quarter=ki.quarters=function(t){return null==t?Math.ceil((this.month()+1)/3):this.month(3*(t-1)+this.month()%3)},ki.month=Lt,ki.daysInMonth=function(){return At(this.year(),this.month())},ki.week=ki.weeks=function(t){var e=this.localeData().week(this);return null==t?e:this.add(7*(t-e),"d")},ki.isoWeek=ki.isoWeeks=function(t){var e=Gt(this,1,4).week;return null==t?e:this.add(7*(t-e),"d")},ki.weeksInYear=function(){var t=this.localeData()._week;return qt(this.year(),t.dow,t.doy)},ki.isoWeeksInYear=function(){return qt(this.year(),1,4)},ki.date=yi,ki.day=ki.days=function(t){if(!this.isValid())return null!=t?this:NaN;var e=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=t?(t=function(t,e){return "string"!=typeof t?t:isNaN(t)?"number"==typeof(t=e.weekdaysParse(t))?t:null:parseInt(t,10)}(t,this.localeData()),this.add(t-e,"d")):e},ki.weekday=function(t){if(!this.isValid())return null!=t?this:NaN;var e=(this.day()+7-this.localeData()._week.dow)%7;return null==t?e:this.add(t-e,"d")},ki.isoWeekday=function(t){if(!this.isValid())return null!=t?this:NaN;if(null!=t){var e=function(t,e){return "string"==typeof t?e.weekdaysParse(t)%7||7:isNaN(t)?null:t}(t,this.localeData());return this.day(this.day()%7?e:e-7)}return this.day()||7},ki.dayOfYear=function(t){var e=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==t?e:this.add(t-e,"d")},ki.hour=ki.hours=ae,ki.minute=ki.minutes=gi,ki.second=ki.seconds=bi,ki.millisecond=ki.milliseconds=_i,ki.utcOffset=function(t,e,i){var o,r=this._offset||0;if(!this.isValid())return null!=t?this:NaN;if(null!=t){if("string"==typeof t){if(null===(t=We(st,t)))return this}else Math.abs(t)<16&&!i&&(t*=60);return !this._isUTC&&e&&(o=Ue(this)),this._offset=t,this._isUTC=!0,null!=o&&this.add(o,"m"),r!==t&&(!e||this._changeInProgress?Qe(this,Ze(t-r,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,n.updateOffset(this,!0),this._changeInProgress=null)),this}return this._isUTC?r:Ue(this)},ki.utc=function(t){return this.utcOffset(0,t)},ki.local=function(t){return this._isUTC&&(this.utcOffset(0,t),this._isUTC=!1,t&&this.subtract(Ue(this),"m")),this},ki.parseZone=function(){if(null!=this._tzm)this.utcOffset(this._tzm,!1,!0);else if("string"==typeof this._i){var t=We(rt,this._i);null!=t?this.utcOffset(t):this.utcOffset(0,!0);}return this},ki.hasAlignedHourOffset=function(t){return !!this.isValid()&&(t=t?Ie(t).utcOffset():0,(this.utcOffset()-t)%60==0)},ki.isDST=function(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()},ki.isLocal=function(){return !!this.isValid()&&!this._isUTC},ki.isUtcOffset=function(){return !!this.isValid()&&this._isUTC},ki.isUtc=Ge,ki.isUTC=Ge,ki.zoneAbbr=function(){return this._isUTC?"UTC":""},ki.zoneName=function(){return this._isUTC?"Coordinated Universal Time":""},ki.dates=S("dates accessor is deprecated. Use date instead.",yi),ki.months=S("months accessor is deprecated. Use month instead",Lt),ki.years=S("years accessor is deprecated. Use year instead",Dt),ki.zone=S("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/",(function(t,e){return null!=t?("string"!=typeof t&&(t=-t),this.utcOffset(t,e),this):-this.utcOffset()})),ki.isDSTShifted=S("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information",(function(){if(!s(this._isDSTShifted))return this._isDSTShifted;var t={};if(g(t,this),(t=Pe(t))._a){var e=t._isUTC?c(t._a):Ie(t._a);this._isDSTShifted=this.isValid()&&x(t._a,e.toArray())>0;}else this._isDSTShifted=!1;return this._isDSTShifted}));var Oi=P.prototype;function Si(t,e,i,n){var o=ve(),r=c().set(n,e);return o[i](r,t)}function Mi(t,e,i){if(a(t)&&(e=t,t=void 0),t=t||"",null!=e)return Si(t,e,i,"month");var n,o=[];for(n=0;n<12;n++)o[n]=Si(t,n,i,"month");return o}function Ei(t,e,i,n){"boolean"==typeof t?(a(e)&&(i=e,e=void 0),e=e||""):(i=e=t,t=!1,a(e)&&(i=e,e=void 0),e=e||"");var o,r=ve(),s=t?r._week.dow:0;if(null!=i)return Si(e,(i+s)%7,n,"day");var h=[];for(o=0;o<7;o++)h[o]=Si(e,(o+s)%7,n,"day");return h}Oi.calendar=function(t,e,i){var n=this._calendar[t]||this._calendar.sameElse;return T(n)?n.call(e,i):n},Oi.longDateFormat=function(t){var e=this._longDateFormat[t],i=this._longDateFormat[t.toUpperCase()];return e||!i?e:(this._longDateFormat[t]=i.replace(/MMMM|MM|DD|dddd/g,(function(t){return t.slice(1)})),this._longDateFormat[t])},Oi.invalidDate=function(){return this._invalidDate},Oi.ordinal=function(t){return this._ordinal.replace("%d",t)},Oi.preparse=xi,Oi.postformat=xi,Oi.relativeTime=function(t,e,i,n){var o=this._relativeTime[i];return T(o)?o(t,e,i,n):o.replace(/%d/i,t)},Oi.pastFuture=function(t,e){var i=this._relativeTime[t>0?"future":"past"];return T(i)?i(e):i.replace(/%s/i,e)},Oi.set=function(t){var e,i;for(i in t)T(e=t[i])?this[i]=e:this["_"+i]=e;this._config=t,this._dayOfMonthOrdinalParseLenient=new RegExp((this._dayOfMonthOrdinalParse.source||this._ordinalParse.source)+"|"+/\d{1,2}/.source);},Oi.months=function(t,e){return t?o(this._months)?this._months[t.month()]:this._months[(this._months.isFormat||It).test(e)?"format":"standalone"][t.month()]:o(this._months)?this._months:this._months.standalone},Oi.monthsShort=function(t,e){return t?o(this._monthsShort)?this._monthsShort[t.month()]:this._monthsShort[It.test(e)?"format":"standalone"][t.month()]:o(this._monthsShort)?this._monthsShort:this._monthsShort.standalone},Oi.monthsParse=function(t,e,i){var n,o,r;if(this._monthsParseExact)return jt.call(this,t,e,i);for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),n=0;n<12;n++){if(o=c([2e3,n]),i&&!this._longMonthsParse[n]&&(this._longMonthsParse[n]=new RegExp("^"+this.months(o,"").replace(".","")+"$","i"),this._shortMonthsParse[n]=new RegExp("^"+this.monthsShort(o,"").replace(".","")+"$","i")),i||this._monthsParse[n]||(r="^"+this.months(o,"")+"|^"+this.monthsShort(o,""),this._monthsParse[n]=new RegExp(r.replace(".",""),"i")),i&&"MMMM"===e&&this._longMonthsParse[n].test(t))return n;if(i&&"MMM"===e&&this._shortMonthsParse[n].test(t))return n;if(!i&&this._monthsParse[n].test(t))return n}},Oi.monthsRegex=function(t){return this._monthsParseExact?(d(this,"_monthsRegex")||Yt.call(this),t?this._monthsStrictRegex:this._monthsRegex):(d(this,"_monthsRegex")||(this._monthsRegex=Bt),this._monthsStrictRegex&&t?this._monthsStrictRegex:this._monthsRegex)},Oi.monthsShortRegex=function(t){return this._monthsParseExact?(d(this,"_monthsRegex")||Yt.call(this),t?this._monthsShortStrictRegex:this._monthsShortRegex):(d(this,"_monthsShortRegex")||(this._monthsShortRegex=Rt),this._monthsShortStrictRegex&&t?this._monthsShortStrictRegex:this._monthsShortRegex)},Oi.week=function(t){return Gt(t,this._week.dow,this._week.doy).week},Oi.firstDayOfYear=function(){return this._week.doy},Oi.firstDayOfWeek=function(){return this._week.dow},Oi.weekdays=function(t,e){var i=o(this._weekdays)?this._weekdays:this._weekdays[t&&!0!==t&&this._weekdays.isFormat.test(e)?"format":"standalone"];return !0===t?Xt(i,this._week.dow):t?i[t.day()]:i},Oi.weekdaysMin=function(t){return !0===t?Xt(this._weekdaysMin,this._week.dow):t?this._weekdaysMin[t.day()]:this._weekdaysMin},Oi.weekdaysShort=function(t){return !0===t?Xt(this._weekdaysShort,this._week.dow):t?this._weekdaysShort[t.day()]:this._weekdaysShort},Oi.weekdaysParse=function(t,e,i){var n,o,r;if(this._weekdaysParseExact)return Jt.call(this,t,e,i);for(this._weekdaysParse||(this._weekdaysParse=[],this._minWeekdaysParse=[],this._shortWeekdaysParse=[],this._fullWeekdaysParse=[]),n=0;n<7;n++){if(o=c([2e3,1]).day(n),i&&!this._fullWeekdaysParse[n]&&(this._fullWeekdaysParse[n]=new RegExp("^"+this.weekdays(o,"").replace(".","\\.?")+"$","i"),this._shortWeekdaysParse[n]=new RegExp("^"+this.weekdaysShort(o,"").replace(".","\\.?")+"$","i"),this._minWeekdaysParse[n]=new RegExp("^"+this.weekdaysMin(o,"").replace(".","\\.?")+"$","i")),this._weekdaysParse[n]||(r="^"+this.weekdays(o,"")+"|^"+this.weekdaysShort(o,"")+"|^"+this.weekdaysMin(o,""),this._weekdaysParse[n]=new RegExp(r.replace(".",""),"i")),i&&"dddd"===e&&this._fullWeekdaysParse[n].test(t))return n;if(i&&"ddd"===e&&this._shortWeekdaysParse[n].test(t))return n;if(i&&"dd"===e&&this._minWeekdaysParse[n].test(t))return n;if(!i&&this._weekdaysParse[n].test(t))return n}},Oi.weekdaysRegex=function(t){return this._weekdaysParseExact?(d(this,"_weekdaysRegex")||ie.call(this),t?this._weekdaysStrictRegex:this._weekdaysRegex):(d(this,"_weekdaysRegex")||(this._weekdaysRegex=Qt),this._weekdaysStrictRegex&&t?this._weekdaysStrictRegex:this._weekdaysRegex)},Oi.weekdaysShortRegex=function(t){return this._weekdaysParseExact?(d(this,"_weekdaysRegex")||ie.call(this),t?this._weekdaysShortStrictRegex:this._weekdaysShortRegex):(d(this,"_weekdaysShortRegex")||(this._weekdaysShortRegex=te),this._weekdaysShortStrictRegex&&t?this._weekdaysShortStrictRegex:this._weekdaysShortRegex)},Oi.weekdaysMinRegex=function(t){return this._weekdaysParseExact?(d(this,"_weekdaysRegex")||ie.call(this),t?this._weekdaysMinStrictRegex:this._weekdaysMinRegex):(d(this,"_weekdaysMinRegex")||(this._weekdaysMinRegex=ee),this._weekdaysMinStrictRegex&&t?this._weekdaysMinStrictRegex:this._weekdaysMinRegex)},Oi.isPM=function(t){return "p"===(t+"").toLowerCase().charAt(0)},Oi.meridiem=function(t,e,i){return t>11?i?"pm":"PM":i?"am":"AM"},fe("en",{dayOfMonthOrdinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(t){var e=t%10;return t+(1===k(t%100/10)?"th":1===e?"st":2===e?"nd":3===e?"rd":"th")}}),n.lang=S("moment.lang is deprecated. Use moment.locale instead.",fe),n.langData=S("moment.langData is deprecated. Use moment.localeData instead.",ve);var Di=Math.abs;function Ti(t,e,i,n){var o=Ze(e,i);return t._milliseconds+=n*o._milliseconds,t._days+=n*o._days,t._months+=n*o._months,t._bubble()}function Ci(t){return t<0?Math.floor(t):Math.ceil(t)}function Pi(t){return 4800*t/146097}function Ai(t){return 146097*t/4800}function Ii(t){return function(){return this.as(t)}}var Fi=Ii("ms"),Ni=Ii("s"),ji=Ii("m"),zi=Ii("h"),Li=Ii("d"),Ri=Ii("w"),Bi=Ii("M"),Yi=Ii("Q"),Hi=Ii("y");function Wi(t){return function(){return this.isValid()?this._data[t]:NaN}}var Vi=Wi("milliseconds"),Ui=Wi("seconds"),Gi=Wi("minutes"),qi=Wi("hours"),Xi=Wi("days"),Zi=Wi("months"),Ki=Wi("years"),$i=Math.round,Ji={ss:44,s:45,m:45,h:22,d:26,M:11};function Qi(t,e,i,n,o){return o.relativeTime(e||1,!!i,t,n)}var tn=Math.abs;function en(t){return (t>0)-(t<0)||+t}function nn(){if(!this.isValid())return this.localeData().invalidDate();var t,e,i=tn(this._milliseconds)/1e3,n=tn(this._days),o=tn(this._months);t=_(i/60),e=_(t/60),i%=60,t%=60;var r=_(o/12),s=o%=12,a=n,h=e,l=t,d=i?i.toFixed(3).replace(/\.?0+$/,""):"",u=this.asSeconds();if(!u)return "P0D";var c=u<0?"-":"",f=en(this._months)!==en(u)?"-":"",p=en(this._days)!==en(u)?"-":"",v=en(this._milliseconds)!==en(u)?"-":"";return c+"P"+(r?f+r+"Y":"")+(s?f+s+"M":"")+(a?p+a+"D":"")+(h||l||d?"T":"")+(h?v+h+"H":"")+(l?v+l+"M":"")+(d?v+d+"S":"")}var on=Le.prototype;return on.isValid=function(){return this._isValid},on.abs=function(){var t=this._data;return this._milliseconds=Di(this._milliseconds),this._days=Di(this._days),this._months=Di(this._months),t.milliseconds=Di(t.milliseconds),t.seconds=Di(t.seconds),t.minutes=Di(t.minutes),t.hours=Di(t.hours),t.months=Di(t.months),t.years=Di(t.years),this},on.add=function(t,e){return Ti(this,t,e,1)},on.subtract=function(t,e){return Ti(this,t,e,-1)},on.as=function(t){if(!this.isValid())return NaN;var e,i,n=this._milliseconds;if("month"===(t=F(t))||"quarter"===t||"year"===t)switch(e=this._days+n/864e5,i=this._months+Pi(e),t){case"month":return i;case"quarter":return i/3;case"year":return i/12}else switch(e=this._days+Math.round(Ai(this._months)),t){case"week":return e/7+n/6048e5;case"day":return e+n/864e5;case"hour":return 24*e+n/36e5;case"minute":return 1440*e+n/6e4;case"second":return 86400*e+n/1e3;case"millisecond":return Math.floor(864e5*e)+n;default:throw new Error("Unknown unit "+t)}},on.asMilliseconds=Fi,on.asSeconds=Ni,on.asMinutes=ji,on.asHours=zi,on.asDays=Li,on.asWeeks=Ri,on.asMonths=Bi,on.asQuarters=Yi,on.asYears=Hi,on.valueOf=function(){return this.isValid()?this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*k(this._months/12):NaN},on._bubble=function(){var t,e,i,n,o,r=this._milliseconds,s=this._days,a=this._months,h=this._data;return r>=0&&s>=0&&a>=0||r<=0&&s<=0&&a<=0||(r+=864e5*Ci(Ai(a)+s),s=0,a=0),h.milliseconds=r%1e3,t=_(r/1e3),h.seconds=t%60,e=_(t/60),h.minutes=e%60,i=_(e/60),h.hours=i%24,s+=_(i/24),o=_(Pi(s)),a+=o,s-=Ci(Ai(o)),n=_(a/12),a%=12,h.days=s,h.months=a,h.years=n,this},on.clone=function(){return Ze(this)},on.get=function(t){return t=F(t),this.isValid()?this[t+"s"]():NaN},on.milliseconds=Vi,on.seconds=Ui,on.minutes=Gi,on.hours=qi,on.days=Xi,on.weeks=function(){return _(this.days()/7)},on.months=Zi,on.years=Ki,on.humanize=function(t){if(!this.isValid())return this.localeData().invalidDate();var e=this.localeData(),i=function(t,e,i){var n=Ze(t).abs(),o=$i(n.as("s")),r=$i(n.as("m")),s=$i(n.as("h")),a=$i(n.as("d")),h=$i(n.as("M")),l=$i(n.as("y")),d=o<=Ji.ss&&["s",o]||o<Ji.s&&["ss",o]||r<=1&&["m"]||r<Ji.m&&["mm",r]||s<=1&&["h"]||s<Ji.h&&["hh",s]||a<=1&&["d"]||a<Ji.d&&["dd",a]||h<=1&&["M"]||h<Ji.M&&["MM",h]||l<=1&&["y"]||["yy",l];return d[2]=e,d[3]=+t>0,d[4]=i,Qi.apply(null,d)}(this,!t,e);return t&&(i=e.pastFuture(+this,i)),e.postformat(i)},on.toISOString=nn,on.toString=nn,on.toJSON=nn,on.locale=ni,on.localeData=ri,on.toIsoString=S("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",nn),on.lang=oi,W("X",0,0,"unix"),W("x",0,0,"valueOf"),lt("x",ot),lt("X",/[+-]?\d+(\.\d{1,3})?/),ft("X",(function(t,e,i){i._d=new Date(1e3*parseFloat(t,10));})),ft("x",(function(t,e,i){i._d=new Date(k(t));})),n.version="2.24.0",e=Ie,n.fn=ki,n.min=function(){return je("isBefore",[].slice.call(arguments,0))},n.max=function(){return je("isAfter",[].slice.call(arguments,0))},n.now=function(){return Date.now?Date.now():+new Date},n.utc=c,n.unix=function(t){return Ie(1e3*t)},n.months=function(t,e){return Mi(t,e,"months")},n.isDate=h,n.locale=fe,n.invalid=v,n.duration=Ze,n.isMoment=w,n.weekdays=function(t,e,i){return Ei(t,e,i,"weekdays")},n.parseZone=function(){return Ie.apply(null,arguments).parseZone()},n.localeData=ve,n.isDuration=Re,n.monthsShort=function(t,e){return Mi(t,e,"monthsShort")},n.weekdaysMin=function(t,e,i){return Ei(t,e,i,"weekdaysMin")},n.defineLocale=pe,n.updateLocale=function(t,e){if(null!=e){var i,n,o=he;null!=(n=ce(t))&&(o=n._config),e=C(o,e),(i=new P(e)).parentLocale=le[t],le[t]=i,fe(t);}else null!=le[t]&&(null!=le[t].parentLocale?le[t]=le[t].parentLocale:null!=le[t]&&delete le[t]);return le[t]},n.locales=function(){return M(le)},n.weekdaysShort=function(t,e,i){return Ei(t,e,i,"weekdaysShort")},n.normalizeUnits=F,n.relativeTimeRounding=function(t){return void 0===t?$i:"function"==typeof t&&($i=t,!0)},n.relativeTimeThreshold=function(t,e){return void 0!==Ji[t]&&(void 0===e?Ji[t]:(Ji[t]=e,"s"===t&&(Ji.ss=e-1),!0))},n.calendarFormat=function(t,e){var i=t.diff(e,"days",!0);return i<-6?"sameElse":i<-1?"lastWeek":i<0?"lastDay":i<1?"sameDay":i<2?"nextDay":i<7?"nextWeek":"sameElse"},n.prototype=ki,n.HTML5_FMT={DATETIME_LOCAL:"YYYY-MM-DDTHH:mm",DATETIME_LOCAL_SECONDS:"YYYY-MM-DDTHH:mm:ss",DATETIME_LOCAL_MS:"YYYY-MM-DDTHH:mm:ss.SSS",DATE:"YYYY-MM-DD",TIME:"HH:mm",TIME_SECONDS:"HH:mm:ss",TIME_MS:"HH:mm:ss.SSS",WEEK:"GGGG-[W]WW",MONTH:"YYYY-MM"},n}();})),qx=/^\/?Date\((-?\d+)/i;function Xx(t){return Gx.isMoment(t)}function Zx(t,e){var i;if(void 0!==t){if(null===t)return null;if(!e)return t;if("string"!=typeof e&&!(e instanceof String))throw new Error("Type must be a string");switch(e){case"boolean":case"Boolean":return Boolean(t);case"number":case"Number":return Hx(t)&&!isNaN(Date.parse(t))?Gx(t).valueOf():Number(t.valueOf());case"string":case"String":return String(t);case"Date":if(Yx(t))return new Date(t);if(t instanceof Date)return new Date(t.valueOf());if(Xx(t))return new Date(t.valueOf());if(Hx(t))return (i=qx.exec(t))?new Date(Number(i[1])):Gx(new Date(t)).toDate();throw new Error("Cannot convert object of type "+Ux(t)+" to type Date");case"Moment":if(Yx(t))return Gx(t);if(t instanceof Date)return Gx(t.valueOf());if(Xx(t))return Gx(t);if(Hx(t))return i=qx.exec(t),Gx(i?Number(i[1]):t);throw new Error("Cannot convert object of type "+Ux(t)+" to type Date");case"ISODate":if(Yx(t))return new Date(t);if(t instanceof Date)return t.toISOString();if(Xx(t))return t.toDate().toISOString();if(Hx(t))return (i=qx.exec(t))?new Date(Number(i[1])).toISOString():Gx(t).format();throw new Error("Cannot convert object of type "+Ux(t)+" to type ISODate");case"ASPDate":if(Yx(t))return "/Date("+t+")/";if(t instanceof Date||Xx(t))return "/Date("+t.valueOf()+")/";if(Hx(t))return "/Date("+((i=qx.exec(t))?new Date(Number(i[1])).valueOf():new Date(t).valueOf())+")/";throw new Error("Cannot convert object of type "+Ux(t)+" to type ASPDate");default:throw new Error("Unknown type ".concat(e))}}}function Kx(t){return "string"==typeof t||"number"==typeof t}var $x=Math.max,Jx=Math.min;Nf({target:"Array",proto:!0,forced:!Ug("splice")},{splice:function(t,e){var i,n,o,r,s,a,h=Fp(this),l=Hf(h.length),d=Uf(t,l),u=arguments.length;if(0===u?i=n=0:1===u?(i=0,n=l-d):(i=u-2,n=Jx($x(Bf(e),0),l-d)),l+i-n>9007199254740991)throw TypeError("Maximum allowed length exceeded");for(o=Ov(h,n),r=0;r<n;r++)(s=d+r)in h&&ap(o,r,h[s]);if(o.length=n,i<n){for(r=d;r<l-n;r++)a=r+i,(s=r+n)in h?h[a]=h[s]:delete h[a];for(r=l;r>l-n+i;r--)delete h[r-1];}else if(i>n)for(r=l-n;r>d;r--)a=r+i-1,(s=r+n-1)in h?h[a]=h[s]:delete h[a];for(r=0;r<i;r++)h[r+d]=arguments[r+2];return h.length=l-n+i,o}});var Qx=Pv("Array").splice,tO=Array.prototype,eO=function(t){var e=t.splice;return t===tO||t instanceof Array&&e===tO.splice?Qx:e},iO=[].slice,nO=/MSIE .\./.test(Rg),oO=function(t){return function(e,i){var n=arguments.length>2,o=n?iO.call(arguments,2):void 0;return t(n?function(){("function"==typeof e?e:Function(e)).apply(this,o);}:e,i)}};Nf({global:!0,bind:!0,forced:nO},{setTimeout:oO(Zc.setTimeout),setInterval:oO(Zc.setInterval)});var rO=Mf.setTimeout,sO=function(){function t(e){Wm(this,t),this._queue=[],this._timeout=null,this._extended=null,this.delay=null,this.max=1/0,this.setOptions(e);}return Um(t,[{key:"setOptions",value:function(t){t&&void 0!==t.delay&&(this.delay=t.delay),t&&void 0!==t.max&&(this.max=t.max),this._flushIfNeeded();}},{key:"destroy",value:function(){if(this.flush(),this._extended){for(var t=this._extended.object,e=this._extended.methods,i=0;i<e.length;i++){var n=e[i];n.original?t[n.name]=n.original:delete t[n.name];}this._extended=null;}}},{key:"replace",value:function(t,e){var i=this,n=t[e];if(!n)throw new Error("Method "+e+" undefined");t[e]=function(){for(var t=arguments.length,e=new Array(t),o=0;o<t;o++)e[o]=arguments[o];i.queue({args:e,fn:n,context:this});};}},{key:"queue",value:function(t){"function"==typeof t?this._queue.push({fn:t}):this._queue.push(t),this._flushIfNeeded();}},{key:"_flushIfNeeded",value:function(){var t=this;this._queue.length>this.max&&this.flush(),null!=this._timeout&&(clearTimeout(this._timeout),this._timeout=null),this.queue.length>0&&"number"==typeof this.delay&&(this._timeout=rO((function(){t.flush();}),this.delay));}},{key:"flush",value:function(){var t,e;Nv(t=eO(e=this._queue).call(e,0)).call(t,(function(t){t.fn.apply(t.context||t.fn,t.args||[]);}));}}],[{key:"extend",value:function(e,i){var n=new t(i);if(void 0!==e.flush)throw new Error("Target object already has a property flush");e.flush=function(){n.flush();};var o=[{name:"flush",original:void 0}];if(i&&i.replace)for(var r=0;r<i.replace.length;r++){var s=i.replace[r];o.push({name:s,original:e[s]}),n.replace(e,s);}return n._extended={object:e,methods:o},n}}]),t}(),aO=function(){function t(){Wm(this,t),this._subscribers={"*":[],add:[],remove:[],update:[]},this.subscribe=t.prototype.on,this.unsubscribe=t.prototype.off;}return Um(t,[{key:"_trigger",value:function(t,e,i){var n,o;if("*"===t)throw new Error("Cannot trigger event *");Nv(n=om(o=[]).call(o,Lg(this._subscribers[t]),Lg(this._subscribers["*"]))).call(n,(function(n){n(t,e,null!=i?i:null);}));}},{key:"on",value:function(t,e){"function"==typeof e&&this._subscribers[t].push(e);}},{key:"off",value:function(t,e){var i;this._subscribers[t]=$g(i=this._subscribers[t]).call(i,(function(t){return t!==e}));}}]),t}(),hO=(Im("Set",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),Bm),Mf.Set),lO=Qm;var dO=function(t){if(wg(t))return t};var uO=function(t,e){if(Ig(Object(t))||"[object Arguments]"===Object.prototype.toString.call(t)){var i=[],n=!0,o=!1,r=void 0;try{for(var s,a=eg(t);!(n=(s=a.next()).done)&&(i.push(s.value),!e||i.length!==e);n=!0);}catch(t){o=!0,r=t;}finally{try{n||null==a.return||a.return();}finally{if(o)throw r}}return i}};var cO=function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")};var fO=function(t,e){return dO(t)||uO(t,e)||cO()},pO=function(){function t(e){Wm(this,t),this._pairs=e;}return Um(t,[{key:Ry,value:Iy.mark((function t(){var e,i,n,o,r,s,a,h;return Iy.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=!0,i=!1,n=void 0,t.prev=3,o=eg(this._pairs);case 5:if(e=(r=o.next()).done){t.next=12;break}return s=fO(r.value,2),a=s[0],h=s[1],t.next=9,[a,h];case 9:e=!0,t.next=5;break;case 12:t.next=18;break;case 14:t.prev=14,t.t0=t.catch(3),i=!0,n=t.t0;case 18:t.prev=18,t.prev=19,e||null==o.return||o.return();case 21:if(t.prev=21,!i){t.next=24;break}throw n;case 24:return t.finish(21);case 25:return t.finish(18);case 26:case"end":return t.stop()}}),t,this,[[3,14,18,26],[19,,21,25]])}))},{key:"entries",value:Iy.mark((function t(){var e,i,n,o,r,s,a,h;return Iy.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=!0,i=!1,n=void 0,t.prev=3,o=eg(this._pairs);case 5:if(e=(r=o.next()).done){t.next=12;break}return s=fO(r.value,2),a=s[0],h=s[1],t.next=9,[a,h];case 9:e=!0,t.next=5;break;case 12:t.next=18;break;case 14:t.prev=14,t.t0=t.catch(3),i=!0,n=t.t0;case 18:t.prev=18,t.prev=19,e||null==o.return||o.return();case 21:if(t.prev=21,!i){t.next=24;break}throw n;case 24:return t.finish(21);case 25:return t.finish(18);case 26:case"end":return t.stop()}}),t,this,[[3,14,18,26],[19,,21,25]])}))},{key:"keys",value:Iy.mark((function t(){var e,i,n,o,r,s,a;return Iy.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=!0,i=!1,n=void 0,t.prev=3,o=eg(this._pairs);case 5:if(e=(r=o.next()).done){t.next=12;break}return s=fO(r.value,1),a=s[0],t.next=9,a;case 9:e=!0,t.next=5;break;case 12:t.next=18;break;case 14:t.prev=14,t.t0=t.catch(3),i=!0,n=t.t0;case 18:t.prev=18,t.prev=19,e||null==o.return||o.return();case 21:if(t.prev=21,!i){t.next=24;break}throw n;case 24:return t.finish(21);case 25:return t.finish(18);case 26:case"end":return t.stop()}}),t,this,[[3,14,18,26],[19,,21,25]])}))},{key:"values",value:Iy.mark((function t(){var e,i,n,o,r,s,a;return Iy.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=!0,i=!1,n=void 0,t.prev=3,o=eg(this._pairs);case 5:if(e=(r=o.next()).done){t.next=12;break}return s=fO(r.value,2),a=s[1],t.next=9,a;case 9:e=!0,t.next=5;break;case 12:t.next=18;break;case 14:t.prev=14,t.t0=t.catch(3),i=!0,n=t.t0;case 18:t.prev=18,t.prev=19,e||null==o.return||o.return();case 21:if(t.prev=21,!i){t.next=24;break}throw n;case 24:return t.finish(21);case 25:return t.finish(18);case 26:case"end":return t.stop()}}),t,this,[[3,14,18,26],[19,,21,25]])}))},{key:"toIdArray",value:function(){var t;return mm(t=Lg(this._pairs)).call(t,(function(t){return t[0]}))}},{key:"toItemArray",value:function(){var t;return mm(t=Lg(this._pairs)).call(t,(function(t){return t[1]}))}},{key:"toEntryArray",value:function(){return Lg(this._pairs)}},{key:"toObjectMap",value:function(){var t=lO(null),e=!0,i=!1,n=void 0;try{for(var o,r=eg(this._pairs);!(e=(o=r.next()).done);e=!0){var s=fO(o.value,2),a=s[0],h=s[1];t[a]=h;}}catch(t){i=!0,n=t;}finally{try{e||null==r.return||r.return();}finally{if(i)throw n}}return t}},{key:"toMap",value:function(){return new Ym(this._pairs)}},{key:"toIdSet",value:function(){return new hO(this.toIdArray())}},{key:"toItemSet",value:function(){return new hO(this.toItemArray())}},{key:"cache",value:function(){return new t(Lg(this._pairs))}},{key:"distinct",value:function(t){var e=new hO,i=!0,n=!1,o=void 0;try{for(var r,s=eg(this._pairs);!(i=(r=s.next()).done);i=!0){var a=fO(r.value,2),h=a[0],l=a[1];e.add(t(l,h));}}catch(t){n=!0,o=t;}finally{try{i||null==s.return||s.return();}finally{if(n)throw o}}return e}},{key:"filter",value:function(e){var i=this._pairs;return new t(Xy({},Ry,Iy.mark((function t(){var n,o,r,s,a,h,l,d;return Iy.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:n=!0,o=!1,r=void 0,t.prev=3,s=eg(i);case 5:if(n=(a=s.next()).done){t.next=13;break}if(h=fO(a.value,2),l=h[0],d=h[1],!e(d,l)){t.next=10;break}return t.next=10,[l,d];case 10:n=!0,t.next=5;break;case 13:t.next=19;break;case 15:t.prev=15,t.t0=t.catch(3),o=!0,r=t.t0;case 19:t.prev=19,t.prev=20,n||null==s.return||s.return();case 22:if(t.prev=22,!o){t.next=25;break}throw r;case 25:return t.finish(22);case 26:return t.finish(19);case 27:case"end":return t.stop()}}),t,null,[[3,15,19,27],[20,,22,26]])}))))}},{key:"forEach",value:function(t){var e=!0,i=!1,n=void 0;try{for(var o,r=eg(this._pairs);!(e=(o=r.next()).done);e=!0){var s=fO(o.value,2),a=s[0];t(s[1],a);}}catch(t){i=!0,n=t;}finally{try{e||null==r.return||r.return();}finally{if(i)throw n}}}},{key:"map",value:function(e){var i=this._pairs;return new t(Xy({},Ry,Iy.mark((function t(){var n,o,r,s,a,h,l,d;return Iy.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:n=!0,o=!1,r=void 0,t.prev=3,s=eg(i);case 5:if(n=(a=s.next()).done){t.next=12;break}return h=fO(a.value,2),l=h[0],d=h[1],t.next=9,[l,e(d,l)];case 9:n=!0,t.next=5;break;case 12:t.next=18;break;case 14:t.prev=14,t.t0=t.catch(3),o=!0,r=t.t0;case 18:t.prev=18,t.prev=19,n||null==s.return||s.return();case 21:if(t.prev=21,!o){t.next=24;break}throw r;case 24:return t.finish(21);case 25:return t.finish(18);case 26:case"end":return t.stop()}}),t,null,[[3,14,18,26],[19,,21,25]])}))))}},{key:"max",value:function(t){var e=eg(this._pairs),i=e.next();if(i.done)return null;for(var n=i.value[1],o=t(i.value[1],i.value[0]);!(i=e.next()).done;){var r=fO(i.value,2),s=r[0],a=r[1],h=t(a,s);h>o&&(o=h,n=a);}return n}},{key:"min",value:function(t){var e=eg(this._pairs),i=e.next();if(i.done)return null;for(var n=i.value[1],o=t(i.value[1],i.value[0]);!(i=e.next()).done;){var r=fO(i.value,2),s=r[0],a=r[1],h=t(a,s);h<o&&(o=h,n=a);}return n}},{key:"reduce",value:function(t,e){var i=!0,n=!1,o=void 0;try{for(var r,s=eg(this._pairs);!(i=(r=s.next()).done);i=!0){var a=fO(r.value,2),h=a[0];e=t(e,a[1],h);}}catch(t){n=!0,o=t;}finally{try{i||null==s.return||s.return();}finally{if(n)throw o}}return e}},{key:"sort",value:function(e){var i=this;return new t(Xy({},Ry,(function(){var t;return eg(lg(t=Lg(i._pairs)).call(t,(function(t,i){var n=fO(t,2),o=n[0],r=n[1],s=fO(i,2),a=s[0],h=s[1];return e(r,h,o,a)})))})))}}]),t}();function vO(t,e){var i=Om(t);if(_y){var n=_y(t);e&&(n=$g(n).call(n,(function(e){return Lv(t,e).enumerable}))),i.push.apply(i,n);}return i}var yO=function(){console.warn("Type coercion has been deprecated. Please, use data pipes instead. See https://visjs.github.io/vis-data/data/datapipe.html#TypeCoercion for more details with working migration example."),console.trace();},gO=function(t){function e(t,i){var n;if(Wm(this,e),n=qm(this,$m(e).call(this)),t&&!Hm(t)&&(i=t,t=[]),n._options=i||{},n._data=new Ym,n.length=0,n._idProp=n._options.fieldId||"id",n._type={},n._options.type){yO();for(var o=Om(n._options.type),r=0,s=o.length;r<s;r++){var a=o[r],h=n._options.type[a];n._type[a]="Date"==h||"ISODate"==h||"ASPDate"==h?"Date":h;}}return t&&t.length&&n.add(t),n.setOptions(i),n}return ib(e,aO),Um(e,[{key:"setOptions",value:function(t){t&&void 0!==t.queue&&(!1===t.queue?this._queue&&(this._queue.destroy(),delete this._queue):(this._queue||(this._queue=sO.extend(this,{replace:["add","update","remove"]})),t.queue&&"object"===km(t.queue)&&this._queue.setOptions(t.queue)));}},{key:"add",value:function(t,e){var i,n=this,o=[];if(Hm(t)){var r=mm(t).call(t,(function(t){return t[n._idProp]}));if(cm(r).call(r,(function(t){return n._data.has(t)})))throw new Error("A duplicate id was found in the parameter array.");for(var s=0,a=t.length;s<a;s++)i=this._addItem(t[s]),o.push(i);}else{if(!t||"object"!==km(t))throw new Error("Unknown dataType");i=this._addItem(t),o.push(i);}return o.length&&this._trigger("add",{items:o},e),o}},{key:"update",value:function(t,e){var i=this,n=[],o=[],r=[],s=[],a=this._idProp,h=function(t){var e=t[a];if(null!=e&&i._data.has(e)){var h=t,l=hm({},i._data.get(e)),d=i._updateItem(h);o.push(d),s.push(h),r.push(l);}else{var u=i._addItem(t);n.push(u);}};if(Hm(t))for(var l=0,d=t.length;l<d;l++)t[l]&&"object"===km(t[l])?h(t[l]):console.warn("Ignoring input item, which is not an object at index "+l);else{if(!t||"object"!==km(t))throw new Error("Unknown dataType");h(t);}if(n.length&&this._trigger("add",{items:n},e),o.length){var u={items:o,oldData:r,data:s};this._trigger("update",u,e);}return om(n).call(n,o)}},{key:"updateOnly",value:function(t,e){var i,n=this;Hm(t)||(t=[t]);var o=mm(i=mm(t).call(t,(function(t){var e=n._data.get(t[n._idProp]);if(null==e)throw new Error("Updating non-existent items is not allowed.");return {oldData:e,update:t}}))).call(i,(function(t){var e=t.oldData,i=t.update,o=e[n._idProp],r=Vx(Vx({},e),i);return n._data.set(o,r),{id:o,oldData:e,updatedData:r}}));if(o.length){var r={items:mm(o).call(o,(function(t){return t.id})),oldData:mm(o).call(o,(function(t){return t.oldData})),data:mm(o).call(o,(function(t){return t.updatedData}))};return this._trigger("update",r,e),r.items}return []}},{key:"get",value:function(t,e){var i=void 0,n=void 0,o=void 0;Kx(t)?(i=t,o=e):Hm(t)?(n=t,o=e):o=t;var r=o&&"Object"===o.returnType?"Object":"Array",s=o&&o.type||this._options.type,a=o&&$g(o),h=[],l=null,d=null,u=null;if(null!=i)(l=this._getItem(i,s))&&a&&!a(l)&&(l=null);else if(null!=n)for(var c=0,f=n.length;c<f;c++)null==(l=this._getItem(n[c],s))||a&&!a(l)||h.push(l);else for(var p,v=0,y=(d=Lg(mg(p=this._data).call(p))).length;v<y;v++)u=d[v],null==(l=this._getItem(u,s))||a&&!a(l)||h.push(l);if(o&&o.order&&null==i&&this._sort(h,o.order),o&&o.fields){var g=o.fields;if(null!=i&&null!=l)l=this._filterFields(l,g);else for(var m=0,b=h.length;m<b;m++)h[m]=this._filterFields(h[m],g);}if("Object"==r){for(var w={},_=0,k=h.length;_<k;_++){var x=h[_];w[x[this._idProp]]=x;}return w}return null!=i?l:h}},{key:"getIds",value:function(t){var e,i,n=this._data,o=t&&$g(t),r=t&&t.order,s=t&&t.type||this._options.type,a=Lg(mg(n).call(n)),h=[];if(o)if(r){i=[];for(var l=0,d=a.length;l<d;l++){var u=a[l];o(e=this._getItem(u,s))&&i.push(e);}this._sort(i,r);for(var c=0,f=i.length;c<f;c++)h.push(i[c][this._idProp]);}else for(var p=0,v=a.length;p<v;p++){var y=a[p];o(e=this._getItem(y,s))&&h.push(e[this._idProp]);}else if(r){i=[];for(var g=0,m=a.length;g<m;g++){var b=a[g];i.push(n.get(b));}this._sort(i,r);for(var w=0,_=i.length;w<_;w++)h.push(i[w][this._idProp]);}else for(var k=0,x=a.length;k<x;k++){var O=a[k];e=n.get(O),h.push(e[this._idProp]);}return h}},{key:"getDataSet",value:function(){return this}},{key:"forEach",value:function(t,e){var i=e&&$g(e),n=e&&e.type||this._options.type,o=this._data,r=Lg(mg(o).call(o));if(e&&e.order)for(var s=this.get(e),a=0,h=s.length;a<h;a++){var l=s[a];t(l,l[this._idProp]);}else for(var d=0,u=r.length;d<u;d++){var c=r[d],f=this._getItem(c,n);i&&!i(f)||t(f,c);}}},{key:"map",value:function(t,e){for(var i=e&&$g(e),n=e&&e.type||this._options.type,o=[],r=this._data,s=Lg(mg(r).call(r)),a=0,h=s.length;a<h;a++){var l=s[a],d=this._getItem(l,n);i&&!i(d)||o.push(t(d,l));}return e&&e.order&&this._sort(o,e.order),o}},{key:"_filterFields",value:function(t,e){var i;return t?pg(i=Hm(e)?e:Om(e)).call(i,(function(e,i){return e[i]=t[i],e}),{}):t}},{key:"_sort",value:function(t,e){if("string"==typeof e){var i=e;lg(t).call(t,(function(t,e){var n=t[i],o=e[i];return n>o?1:n<o?-1:0}));}else{if("function"!=typeof e)throw new TypeError("Order must be a function or a string");lg(t).call(t,e);}}},{key:"remove",value:function(t,e){for(var i=[],n=[],o=Hm(t)?t:[t],r=0,s=o.length;r<s;r++){var a=this._remove(o[r]);if(a){var h=a[this._idProp];null!=h&&(i.push(h),n.push(a));}}return i.length&&this._trigger("remove",{items:i,oldData:n},e),i}},{key:"_remove",value:function(t){var e;if(Kx(t)?e=t:t&&"object"===km(t)&&(e=t[this._idProp]),null!=e&&this._data.has(e)){var i=this._data.get(e)||null;return this._data.delete(e),--this.length,i}return null}},{key:"clear",value:function(t){for(var e,i=Lg(mg(e=this._data).call(e)),n=[],o=0,r=i.length;o<r;o++)n.push(this._data.get(i[o]));return this._data.clear(),this.length=0,this._trigger("remove",{items:i,oldData:n},t),i}},{key:"max",value:function(t){var e=null,i=null,n=!0,o=!1,r=void 0;try{for(var s,a=eg(Jy(h=this._data).call(h));!(n=(s=a.next()).done);n=!0){var h,l=s.value,d=l[t];"number"==typeof d&&(null==i||d>i)&&(e=l,i=d);}}catch(t){o=!0,r=t;}finally{try{n||null==a.return||a.return();}finally{if(o)throw r}}return e||null}},{key:"min",value:function(t){var e=null,i=null,n=!0,o=!1,r=void 0;try{for(var s,a=eg(Jy(h=this._data).call(h));!(n=(s=a.next()).done);n=!0){var h,l=s.value,d=l[t];"number"==typeof d&&(null==i||d<i)&&(e=l,i=d);}}catch(t){o=!0,r=t;}finally{try{n||null==a.return||a.return();}finally{if(o)throw r}}return e||null}},{key:"distinct",value:function(t){for(var e=this._data,i=Lg(mg(e).call(e)),n=[],o=this._options.type&&this._options.type[t]||null,r=0,s=0,a=i.length;s<a;s++){for(var h=i[s],l=e.get(h)[t],d=!1,u=0;u<r;u++)if(n[u]==l){d=!0;break}d||void 0===l||(n[r]=l,r++);}if(o){yO();for(var c=0,f=n.length;c<f;c++)n[c]=Zx(n[c],o);}return n}},{key:"_addItem",value:function(t){var e=t[this._idProp];if(null!=e){if(this._data.has(e))throw new Error("Cannot add item: item with id "+e+" already exists")}else e=lb(),t[this._idProp]=e;for(var i={},n=Om(t),o=0,r=n.length;o<r;o++){var s=n[o],a=this._type[s];null!=a&&yO(),i[s]=Zx(t[s],a);}return this._data.set(e,i),++this.length,e}},{key:"_getItem",value:function(t,e){var i,n=this._data.get(t);if(!n)return null;var o=Om(n);if(e){yO(),i={};for(var r=0,s=o.length;r<s;r++){var a=o[r],h=n[a];i[a]=Zx(h,e[a]);}}else i=function(t){for(var e=1;e<arguments.length;e++){var i,n=null!=arguments[e]?arguments[e]:{};if(e%2)Nv(i=vO(Object(n),!0)).call(i,(function(e){Xy(t,e,n[e]);}));else if(up)tp(t,up(n));else{var o;Nv(o=vO(Object(n))).call(o,(function(e){zf(t,e,Lv(n,e));}));}}return t}({},n);return null==i[this._idProp]&&(i[this._idProp]=n.id),i}},{key:"_updateItem",value:function(t){var e=t[this._idProp];if(null==e)throw new Error("Cannot update item: item has no id (item: "+Gy(t)+")");var i=this._data.get(e);if(!i)throw new Error("Cannot update item: no item with id "+e+" found");for(var n=Om(t),o=0,r=n.length;o<r;o++){var s=n[o],a=this._type[s];null!=a&&yO(),i[s]=Zx(t[s],a);}return e}},{key:"stream",value:function(t){if(t){var e=this._data;return new pO(Xy({},Ry,Iy.mark((function i(){var n,o,r,s,a,h,l;return Iy.wrap((function(i){for(;;)switch(i.prev=i.next){case 0:n=!0,o=!1,r=void 0,i.prev=3,s=eg(t);case 5:if(n=(a=s.next()).done){i.next=14;break}if(h=a.value,null==(l=e.get(h))){i.next=11;break}return i.next=11,[h,l];case 11:n=!0,i.next=5;break;case 14:i.next=20;break;case 16:i.prev=16,i.t0=i.catch(3),o=!0,r=i.t0;case 20:i.prev=20,i.prev=21,n||null==s.return||s.return();case 23:if(i.prev=23,!o){i.next=26;break}throw r;case 26:return i.finish(23);case 27:return i.finish(20);case 28:case"end":return i.stop()}}),i,null,[[3,16,20,28],[21,,23,27]])}))))}var i;return new pO(Xy({},Ry,Ay(i=Sy(this._data)).call(i,this._data)))}}]),e}(),mO=function(t){function e(t,i){var n,o;return Wm(this,e),(o=qm(this,$m(e).call(this))).length=0,o._ids=new hO,o._options=i||{},o._listener=Ay(n=o._onEvent).call(n,Gm(o)),o.setData(t),o}return ib(e,aO),Um(e,[{key:"setData",value:function(t){if(this._data){this._data.off&&this._data.off("*",this._listener);var e=this._data.getIds({filter:$g(this._options)}),i=this._data.get(e);this._ids.clear(),this.length=0,this._trigger("remove",{items:e,oldData:i});}if(null!=t){this._data=t;for(var n=this._data.getIds({filter:$g(this._options)}),o=0,r=n.length;o<r;o++){var s=n[o];this._ids.add(s);}this.length=n.length,this._trigger("add",{items:n});}else this._data=new gO;this._data.on&&this._data.on("*",this._listener);}},{key:"refresh",value:function(){for(var t=this._data.getIds({filter:$g(this._options)}),e=Lg(this._ids),i={},n=[],o=[],r=[],s=0,a=t.length;s<a;s++){var h=t[s];i[h]=!0,this._ids.has(h)||(n.push(h),this._ids.add(h));}for(var l=0,d=e.length;l<d;l++){var u=e[l],c=this._data.get(u);null==c?console.error("If you see this, report it please."):i[u]||(o.push(u),r.push(c),this._ids.delete(u));}this.length+=n.length-o.length,n.length&&this._trigger("add",{items:n}),o.length&&this._trigger("remove",{items:o,oldData:r});}},{key:"get",value:function(t,e){if(null==this._data)return null;var i,n=null;Kx(t)||Hm(t)?(n=t,i=e):i=t;var o=hm({},this._options,i),r=$g(this._options),s=i&&$g(i);return r&&s&&(o.filter=function(t){return r(t)&&s(t)}),null==n?this._data.get(o):this._data.get(n,o)}},{key:"getIds",value:function(t){if(this._data.length){var e,i=$g(this._options),n=null!=t?$g(t):null;return e=n?i?function(t){return i(t)&&n(t)}:n:i,this._data.getIds({filter:e,order:t&&t.order})}return []}},{key:"forEach",value:function(t,e){if(this._data){var i,n,o=$g(this._options),r=e&&$g(e);n=r?o?function(t){return o(t)&&r(t)}:r:o,Nv(i=this._data).call(i,t,{filter:n,order:e&&e.order});}}},{key:"map",value:function(t,e){if(this._data){var i,n,o=$g(this._options),r=e&&$g(e);return n=r?o?function(t){return o(t)&&r(t)}:r:o,mm(i=this._data).call(i,t,{filter:n,order:e&&e.order})}return []}},{key:"getDataSet",value:function(){return this._data.getDataSet()}},{key:"stream",value:function(t){var e;return this._data.stream(t||Xy({},Ry,Ay(e=mg(this._ids)).call(e,this._ids)))}},{key:"_onEvent",value:function(t,e,i){if(e&&e.items&&this._data){var n=e.items,o=[],r=[],s=[],a=[],h=[],l=[];switch(t){case"add":for(var d=0,u=n.length;d<u;d++){var c=n[d];this.get(c)&&(this._ids.add(c),o.push(c));}break;case"update":for(var f=0,p=n.length;f<p;f++){var v=n[f];this.get(v)?this._ids.has(v)?(r.push(v),h.push(e.data[f]),a.push(e.oldData[f])):(this._ids.add(v),o.push(v)):this._ids.has(v)&&(this._ids.delete(v),s.push(v),l.push(e.oldData[f]));}break;case"remove":for(var y=0,g=n.length;y<g;y++){var m=n[y];this._ids.has(m)&&(this._ids.delete(m),s.push(m),l.push(e.oldData[y]));}}this.length+=o.length-s.length,o.length&&this._trigger("add",{items:o},i),r.length&&this._trigger("update",{items:r,oldData:a,data:h},i),s.length&&this._trigger("remove",{items:s,oldData:l},i);}}}]),e}(),bO={DataSet:gO,DataView:mO,Queue:sO},wO=Object.freeze({__proto__:null,default:bO,DataSet:gO,DataStream:pO,DataView:mO,Queue:sO}),_O=xc;W({target:"Object",stat:!0,forced:!s,sham:!s},{defineProperties:Ga});var kO=i((function(t){var e=F.Object,i=t.exports=function(t,i){return e.defineProperties(t,i)};e.defineProperties.sham&&(i.sham=!0);})),xO=Va.concat("length","prototype"),OO={f:Object.getOwnPropertyNames||function(t){return Wa(t,xO)}},SO={f:Object.getOwnPropertySymbols},MO=Xa("Reflect","ownKeys")||function(t){var e=OO.f(z(t)),i=SO.f;return i?e.concat(i(t)):e};W({target:"Object",stat:!0,sham:!s},{getOwnPropertyDescriptors:function(t){for(var e,i,n=y(t),o=M.f,r=MO(n),s={},a=0;r.length>a;)void 0!==(i=o(n,e=r[a++]))&&Hh(s,e,i);return s}});var EO=F.Object.getOwnPropertyDescriptors,DO=M.f,TO=r((function(){DO(1);}));W({target:"Object",stat:!0,forced:!s||TO,sham:!s},{getOwnPropertyDescriptor:function(t,e){return DO(y(t),e)}});var CO=i((function(t){var e=F.Object,i=t.exports=function(t,i){return e.getOwnPropertyDescriptor(t,i)};e.getOwnPropertyDescriptor.sham&&(i.sham=!0);})),PO=CO,AO=Ch.filter,IO=Zh("filter"),FO=IO&&!r((function(){[].filter.call({length:-1,0:1},(function(t){throw t}));}));W({target:"Array",proto:!0,forced:!IO||!FO},{filter:function(t){return AO(this,t,arguments.length>1?arguments[1]:void 0)}});var NO=X("Array").filter,jO=Array.prototype,zO=function(t){var e=t.filter;return t===jO||t instanceof Array&&e===jO.filter?NO:e},LO=OO.f,RO={}.toString,BO="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[],YO={f:function(t){return BO&&"[object Window]"==RO.call(t)?function(t){try{return LO(t)}catch(t){return BO.slice()}}(t):LO(y(t))}},HO={f:Da},WO=R.f,VO=function(t){var e=F.Symbol||(F.Symbol={});w(e,t)||WO(e,t,{value:HO.f(t)});},UO=Ch.forEach,GO=sa("hidden"),qO=Da("toPrimitive"),XO=ga.set,ZO=ga.getterFor("Symbol"),KO=Object.prototype,$O=o.Symbol,JO=Xa("JSON","stringify"),QO=M.f,tS=R.f,eS=YO.f,iS=l.f,nS=ea("symbols"),oS=ea("op-symbols"),rS=ea("string-to-symbol-registry"),sS=ea("symbol-to-string-registry"),aS=ea("wks"),hS=o.QObject,lS=!hS||!hS.prototype||!hS.prototype.findChild,dS=s&&r((function(){return 7!=th(tS({},"a",{get:function(){return tS(this,"a",{value:7}).a}})).a}))?function(t,e,i){var n=QO(KO,e);n&&delete KO[e],tS(t,e,i),n&&t!==KO&&tS(KO,e,n);}:tS,uS=function(t,e){var i=nS[t]=th($O.prototype);return XO(i,{type:"Symbol",tag:t,description:e}),s||(i.description=e),i},cS=xa&&"symbol"==typeof $O.iterator?function(t){return "symbol"==typeof t}:function(t){return Object(t)instanceof $O},fS=function(t,e,i){t===KO&&fS(oS,e,i),z(t);var n=m(e,!0);return z(i),w(nS,n)?(i.enumerable?(w(t,GO)&&t[GO][n]&&(t[GO][n]=!1),i=th(i,{enumerable:d(0,!1)})):(w(t,GO)||tS(t,GO,d(1,{})),t[GO][n]=!0),dS(t,n,i)):tS(t,n,i)},pS=function(t,e){z(t);var i=y(e),n=Ua(i).concat(mS(i));return UO(n,(function(e){s&&!vS.call(i,e)||fS(t,e,i[e]);})),t},vS=function(t){var e=m(t,!0),i=iS.call(this,e);return !(this===KO&&w(nS,e)&&!w(oS,e))&&(!(i||!w(this,e)||!w(nS,e)||w(this,GO)&&this[GO][e])||i)},yS=function(t,e){var i=y(t),n=m(e,!0);if(i!==KO||!w(nS,n)||w(oS,n)){var o=QO(i,n);return !o||!w(nS,n)||w(i,GO)&&i[GO][n]||(o.enumerable=!0),o}},gS=function(t){var e=eS(y(t)),i=[];return UO(e,(function(t){w(nS,t)||w(aa,t)||i.push(t);})),i},mS=function(t){var e=t===KO,i=eS(e?oS:y(t)),n=[];return UO(i,(function(t){!w(nS,t)||e&&!w(KO,t)||n.push(nS[t]);})),n};if(xa||(fh(($O=function(){if(this instanceof $O)throw TypeError("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?String(arguments[0]):void 0,e=oa(t),i=function(t){this===KO&&i.call(oS,t),w(this,GO)&&w(this[GO],e)&&(this[GO][e]=!1),dS(this,e,d(1,t));};return s&&lS&&dS(KO,e,{configurable:!0,set:i}),uS(e,t)}).prototype,"toString",(function(){return ZO(this).tag})),l.f=vS,R.f=fS,M.f=yS,OO.f=YO.f=gS,SO.f=mS,s&&tS($O.prototype,"description",{configurable:!0,get:function(){return ZO(this).description}})),Oa||(HO.f=function(t){return uS(Da(t),t)}),W({global:!0,wrap:!0,forced:!xa,sham:!xa},{Symbol:$O}),UO(Ua(aS),(function(t){VO(t);})),W({target:"Symbol",stat:!0,forced:!xa},{for:function(t){var e=String(t);if(w(rS,e))return rS[e];var i=$O(e);return rS[e]=i,sS[i]=e,i},keyFor:function(t){if(!cS(t))throw TypeError(t+" is not a symbol");if(w(sS,t))return sS[t]},useSetter:function(){lS=!0;},useSimple:function(){lS=!1;}}),W({target:"Object",stat:!0,forced:!xa,sham:!s},{create:function(t,e){return void 0===e?th(t):pS(th(t),e)},defineProperty:fS,defineProperties:pS,getOwnPropertyDescriptor:yS}),W({target:"Object",stat:!0,forced:!xa},{getOwnPropertyNames:gS,getOwnPropertySymbols:mS}),W({target:"Object",stat:!0,forced:r((function(){SO.f(1);}))},{getOwnPropertySymbols:function(t){return SO.f(ma(t))}}),JO){var bS=!xa||r((function(){var t=$O();return "[null]"!=JO([t])||"{}"!=JO({a:t})||"{}"!=JO(Object(t))}));W({target:"JSON",stat:!0,forced:bS},{stringify:function(t,e,i){for(var n,o=[t],r=1;arguments.length>r;)o.push(arguments[r++]);if(n=e,(g(e)||void 0!==t)&&!cS(t))return Sh(e)||(e=function(t,e){if("function"==typeof n&&(e=n.call(this,t,e)),!cS(e))return e}),o[1]=e,JO.apply(null,o)}});}$O.prototype[qO]||B($O.prototype,qO,$O.prototype.valueOf),lh($O,"Symbol"),aa[GO]=!0;var wS=F.Object.getOwnPropertySymbols,_S=r((function(){Ua(1);}));W({target:"Object",stat:!0,forced:_S},{keys:function(t){return Ua(ma(t))}});var kS=F.Object.keys;var xS=function(t,e,i){return e in t?Oc(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t},OS="\t\n\v\f\r                　\u2028\u2029\ufeff",SS="["+OS+"]",MS=RegExp("^"+SS+SS+"*"),ES=RegExp(SS+SS+"*$"),DS=function(t){return function(e){var i=String(v(e));return 1&t&&(i=i.replace(MS,"")),2&t&&(i=i.replace(ES,"")),i}},TS={start:DS(1),end:DS(2),trim:DS(3)},CS=TS.trim,PS=o.parseFloat,AS=1/PS(OS+"-0")!=-1/0?function(t){var e=CS(String(t)),i=PS(e);return 0===i&&"-"==e.charAt(0)?-0:i}:PS;W({global:!0,forced:parseFloat!=AS},{parseFloat:AS});var IS=F.parseFloat,FS=TS.trim,NS=o.parseInt,jS=/^[+-]?0[Xx]/,zS=8!==NS(OS+"08")||22!==NS(OS+"0x16")?function(t,e){var i=FS(String(t));return NS(i,e>>>0||(jS.test(i)?16:10))}:NS;W({global:!0,forced:parseInt!=zS},{parseInt:zS});var LS=F.parseInt,RS=Bh;var BS=function(t){if(RS(t))return t},YS=Da("iterator"),HS=function(t){var e=Object(t);return void 0!==e[YS]||"@@iterator"in e||Gs.hasOwnProperty(rh(e))};var WS=function(t,e){if(HS(Object(t))||"[object Arguments]"===Object.prototype.toString.call(t)){var i=[],n=!0,o=!1,r=void 0;try{for(var s,a=Bc(t);!(n=(s=a.next()).done)&&(i.push(s.value),!e||i.length!==e);n=!0);}catch(t){o=!0,r=t;}finally{try{n||null==a.return||a.return();}finally{if(o)throw r}}return i}};var VS=function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")};var US=function(t,e){return BS(t)||WS(t,e)||VS()};VO("iterator");var GS=HO.f("iterator"),qS=Da("isConcatSpreadable"),XS=qh>=51||!r((function(){var t=[];return t[qS]=!1,t.concat()[0]!==t})),ZS=Zh("concat"),KS=function(t){if(!g(t))return !1;var e=t[qS];return void 0!==e?!!e:Sh(t)};W({target:"Array",proto:!0,forced:!XS||!ZS},{concat:function(t){var e,i,n,o,r,s=ma(this),a=Eh(s,0),h=0;for(e=-1,n=arguments.length;e<n;e++)if(r=-1===e?s:arguments[e],KS(r)){if(h+(o=ja(r.length))>9007199254740991)throw TypeError("Maximum allowed index exceeded");for(i=0;i<o;i++,h++)i in r&&Hh(a,h,r[i]);}else{if(h>=9007199254740991)throw TypeError("Maximum allowed index exceeded");Hh(a,h++,r);}return a.length=h,a}}),VO("asyncIterator"),VO("hasInstance"),VO("isConcatSpreadable"),VO("match"),VO("matchAll"),VO("replace"),VO("search"),VO("species"),VO("split"),VO("toPrimitive"),VO("toStringTag"),VO("unscopables"),lh(Math,"Math",!0),lh(o.JSON,"JSON",!0);var $S=F.Symbol;VO("asyncDispose"),VO("dispose"),VO("observable"),VO("patternMatch"),VO("replaceAll");var JS=$S,QS=i((function(t){function e(i){return t.exports=e="function"==typeof JS&&"symbol"==typeof GS?function(t){return typeof t}:function(t){return t&&"function"==typeof JS&&t.constructor===JS&&t!==JS.prototype?"symbol":typeof t},e(i)}t.exports=e;})),tM=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"choosify",value:function(t,e){var i=["node","edge","label"],n=!0,o=Ws(e,"chosen");if("boolean"==typeof o)n=o;else if("object"===QS(o)){if(-1===yl(i).call(i,t))throw new Error("choosify: subOption '"+t+"' should be one of '"+i.join("', '")+"'");var r=Ws(e,["chosen",t]);"boolean"!=typeof r&&"function"!=typeof r||(n=r);}return n}},{key:"pointInRect",value:function(t,e,i){if(t.width<=0||t.height<=0)return !1;if(void 0!==i){var n={x:e.x-i.x,y:e.y-i.y};if(0!==i.angle){var o=-i.angle;e={x:Math.cos(o)*n.x-Math.sin(o)*n.y,y:Math.sin(o)*n.x+Math.cos(o)*n.y};}else e=n;}var r=t.x+t.width,s=t.y+t.width;return t.left<e.x&&r>e.x&&t.top<e.y&&s>e.y}},{key:"isValidLabel",value:function(t){return "string"==typeof t&&""!==t}}]),t}(),eM=Da("species"),iM=[].slice,nM=Math.max;W({target:"Array",proto:!0,forced:!Zh("slice")},{slice:function(t,e){var i,n,o,r=y(this),s=ja(r.length),a=Ra(t,s),h=Ra(void 0===e?s:e,s);if(Sh(r)&&("function"!=typeof(i=r.constructor)||i!==Array&&!Sh(i.prototype)?g(i)&&null===(i=i[eM])&&(i=void 0):i=void 0,i===Array||void 0===i))return iM.call(r,a,h);for(n=new(void 0===i?Array:i)(nM(h-a,0)),o=0;a<h;a++,o++)a in r&&Hh(n,o,r[a]);return n.length=o,n}});var oM=X("Array").slice,rM=Array.prototype,sM=function(t){var e=t.slice;return t===rM||t instanceof Array&&e===rM.slice?oM:e},aM=X("Array").values,hM=Array.prototype,lM={DOMTokenList:!0,NodeList:!0},dM=function(t){var e=t.values;return t===hM||t instanceof Array&&e===hM.values||lM.hasOwnProperty(rh(t))?aM:e},uM=Object.assign,cM=Object.defineProperty,fM=!uM||r((function(){if(s&&1!==uM({b:1},uM(cM({},"a",{enumerable:!0,get:function(){cM(this,"b",{value:3,enumerable:!1});}}),{b:2})).b)return !0;var t={},e={},i=Symbol();return t[i]=7,"abcdefghijklmnopqrst".split("").forEach((function(t){e[t]=t;})),7!=uM({},t)[i]||"abcdefghijklmnopqrst"!=Ua(uM({},e)).join("")}))?function(t,e){for(var i=ma(t),n=arguments.length,o=1,r=SO.f,a=l.f;n>o;)for(var h,d=p(arguments[o++]),u=r?Ua(d).concat(r(d)):Ua(d),c=u.length,f=0;c>f;)h=u[f++],s&&!a.call(d,h)||(i[h]=d[h]);return i}:uM;W({target:"Object",stat:!0,forced:Object.assign!==fM},{assign:fM});var pM=F.Object.assign,vM=function(){function t(e){kc(this,t),this.measureText=e,this.current=0,this.width=0,this.height=0,this.lines=[];}return Mc(t,[{key:"_add",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"normal";void 0===this.lines[t]&&(this.lines[t]={width:0,height:0,blocks:[]});var n=e;void 0!==e&&""!==e||(n=" ");var o=this.measureText(n,i),r=pM({},dM(o));r.text=e,r.width=o.width,r.mod=i,void 0!==e&&""!==e||(r.width=0),this.lines[t].blocks.push(r),this.lines[t].width+=r.width;}},{key:"curWidth",value:function(){var t=this.lines[this.current];return void 0===t?0:t.width}},{key:"append",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"normal";this._add(this.current,t,e);}},{key:"newLine",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"normal";this._add(this.current,t,e),this.current++;}},{key:"determineLineHeights",value:function(){for(var t=0;t<this.lines.length;t++){var e=this.lines[t],i=0;if(void 0!==e.blocks)for(var n=0;n<e.blocks.length;n++){var o=e.blocks[n];i<o.height&&(i=o.height);}e.height=i;}}},{key:"determineLabelSize",value:function(){for(var t=0,e=0,i=0;i<this.lines.length;i++){var n=this.lines[i];n.width>t&&(t=n.width),e+=n.height;}this.width=t,this.height=e;}},{key:"removeEmptyBlocks",value:function(){for(var t=[],e=0;e<this.lines.length;e++){var i=this.lines[e];if(0!==i.blocks.length&&(e!==this.lines.length-1||0!==i.width)){var n={};pM(n,i),n.blocks=[];for(var o=void 0,r=[],s=0;s<i.blocks.length;s++){var a=i.blocks[s];0!==a.width?r.push(a):void 0===o&&(o=a);}0===r.length&&void 0!==o&&r.push(o),n.blocks=r,t.push(n);}}return t}},{key:"finalize",value:function(){this.determineLineHeights(),this.determineLabelSize();var t=this.removeEmptyBlocks();return {width:this.width,height:this.height,lines:t}}}]),t}(),yM={"<b>":/<b>/,"<i>":/<i>/,"<code>":/<code>/,"</b>":/<\/b>/,"</i>":/<\/i>/,"</code>":/<\/code>/,"*":/\*/,_:/\_/,"`":/`/,afterBold:/[^\*]/,afterItal:/[^_]/,afterMono:/[^`]/},gM=function(){function t(e){kc(this,t),this.text=e,this.bold=!1,this.ital=!1,this.mono=!1,this.spacing=!1,this.position=0,this.buffer="",this.modStack=[],this.blocks=[];}return Mc(t,[{key:"mod",value:function(){return 0===this.modStack.length?"normal":this.modStack[0]}},{key:"modName",value:function(){return 0===this.modStack.length?"normal":"mono"===this.modStack[0]?"mono":this.bold&&this.ital?"boldital":this.bold?"bold":this.ital?"ital":void 0}},{key:"emitBlock",value:function(){this.spacing&&(this.add(" "),this.spacing=!1),this.buffer.length>0&&(this.blocks.push({text:this.buffer,mod:this.modName()}),this.buffer="");}},{key:"add",value:function(t){" "===t&&(this.spacing=!0),this.spacing&&(this.buffer+=" ",this.spacing=!1)," "!=t&&(this.buffer+=t);}},{key:"parseWS",value:function(t){return !!/[ \t]/.test(t)&&(this.mono?this.add(t):this.spacing=!0,!0)}},{key:"setTag",value:function(t){this.emitBlock(),this[t]=!0,this.modStack.unshift(t);}},{key:"unsetTag",value:function(t){this.emitBlock(),this[t]=!1,this.modStack.shift();}},{key:"parseStartTag",value:function(t,e){return !(this.mono||this[t]||!this.match(e))&&(this.setTag(t),!0)}},{key:"match",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=this.prepareRegExp(t),n=US(i,2),o=n[0],r=n[1],s=o.test(this.text.substr(this.position,r));return s&&e&&(this.position+=r-1),s}},{key:"parseEndTag",value:function(t,e,i){var n=this.mod()===t;return !(!(n="mono"===t?n&&this.mono:n&&!this.mono)||!this.match(e))&&(void 0!==i?(this.position===this.text.length-1||this.match(i,!1))&&this.unsetTag(t):this.unsetTag(t),!0)}},{key:"replace",value:function(t,e){return !!this.match(t)&&(this.add(e),this.position+=length-1,!0)}},{key:"prepareRegExp",value:function(t){var e,i;if(t instanceof RegExp)i=t,e=1;else{var n=yM[t];i=void 0!==n?n:new RegExp(t),e=t.length;}return [i,e]}}]),t}(),mM=function(){function t(e,i,n,o){var r=this;kc(this,t),this.ctx=e,this.parent=i,this.selected=n,this.hover=o;this.lines=new vM((function(t,i){if(void 0===t)return 0;var s=r.parent.getFormattingValues(e,n,o,i),a=0;""!==t&&(a=r.ctx.measureText(t).width);return {width:a,values:s}}));}return Mc(t,[{key:"process",value:function(t){if(!tM.isValidLabel(t))return this.lines.finalize();var e=this.parent.fontOptions;t=(t=t.replace(/\r\n/g,"\n")).replace(/\r/g,"\n");var i=String(t).split("\n"),n=i.length;if(e.multi)for(var o=0;o<n;o++){var r=this.splitBlocks(i[o],e.multi);if(void 0!==r)if(0!==r.length){if(e.maxWdt>0)for(var s=0;s<r.length;s++){var a=r[s].mod,h=r[s].text;this.splitStringIntoLines(h,a,!0);}else for(var l=0;l<r.length;l++){var d=r[l].mod,u=r[l].text;this.lines.append(u,d);}this.lines.newLine();}else this.lines.newLine("");}else if(e.maxWdt>0)for(var c=0;c<n;c++)this.splitStringIntoLines(i[c]);else for(var f=0;f<n;f++)this.lines.newLine(i[f]);return this.lines.finalize()}},{key:"decodeMarkupSystem",value:function(t){var e="none";return "markdown"===t||"md"===t?e="markdown":!0!==t&&"html"!==t||(e="html"),e}},{key:"splitHtmlBlocks",value:function(t){for(var e=new gM(t),i=function(t){return !!/&/.test(t)&&(e.replace(e.text,"&lt;","<")||e.replace(e.text,"&amp;","&")||e.add("&"),!0)};e.position<e.text.length;){var n=e.text.charAt(e.position);e.parseWS(n)||/</.test(n)&&(e.parseStartTag("bold","<b>")||e.parseStartTag("ital","<i>")||e.parseStartTag("mono","<code>")||e.parseEndTag("bold","</b>")||e.parseEndTag("ital","</i>")||e.parseEndTag("mono","</code>"))||i(n)||e.add(n),e.position++;}return e.emitBlock(),e.blocks}},{key:"splitMarkdownBlocks",value:function(t){for(var e=this,i=new gM(t),n=!0,o=function(t){return !!/\\/.test(t)&&(i.position<e.text.length+1&&(i.position++,t=e.text.charAt(i.position),/ \t/.test(t)?i.spacing=!0:(i.add(t),n=!1)),!0)};i.position<i.text.length;){var r=i.text.charAt(i.position);i.parseWS(r)||o(r)||(n||i.spacing)&&(i.parseStartTag("bold","*")||i.parseStartTag("ital","_")||i.parseStartTag("mono","`"))||i.parseEndTag("bold","*","afterBold")||i.parseEndTag("ital","_","afterItal")||i.parseEndTag("mono","`","afterMono")||(i.add(r),n=!1),i.position++;}return i.emitBlock(),i.blocks}},{key:"splitBlocks",value:function(t,e){var i=this.decodeMarkupSystem(e);return "none"===i?[{text:t,mod:"normal"}]:"markdown"===i?this.splitMarkdownBlocks(t):"html"===i?this.splitHtmlBlocks(t):void 0}},{key:"overMaxWidth",value:function(t){var e=this.ctx.measureText(t).width;return this.lines.curWidth()+e>this.parent.fontOptions.maxWdt}},{key:"getLongestFit",value:function(t){for(var e="",i=0;i<t.length;){var n=e+(""===e?"":" ")+t[i];if(this.overMaxWidth(n))break;e=n,i++;}return i}},{key:"getLongestFitWord",value:function(t){for(var e=0;e<t.length&&!this.overMaxWidth(sM(t).call(t,0,e));)e++;return e}},{key:"splitStringIntoLines",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"normal",i=arguments.length>2&&void 0!==arguments[2]&&arguments[2];this.parent.getFormattingValues(this.ctx,this.selected,this.hover,e);for(var n=(t=(t=t.replace(/^( +)/g,"$1\r")).replace(/([^\r][^ ]*)( +)/g,"$1\r$2\r")).split("\r");n.length>0;){var o=this.getLongestFit(n);if(0===o){var r=n[0],s=this.getLongestFitWord(r);this.lines.newLine(sM(r).call(r,0,s),e),n[0]=sM(r).call(r,s);}else{var a=o;" "===n[o-1]?o--:" "===n[a]&&a++;var h=sM(n).call(n,0,o).join("");o==n.length&&i?this.lines.append(h,e):this.lines.newLine(h,e),n=sM(n).call(n,a);}}}}]),t}(),bM=["bold","ital","boldital","mono"],wM=function(){function t(e,i){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2];kc(this,t),this.body=e,this.pointToSelf=!1,this.baseSize=void 0,this.fontOptions={},this.setOptions(i),this.size={top:0,left:0,width:0,height:0,yLine:0},this.isEdgeLabel=n;}return Mc(t,[{key:"setOptions",value:function(t){if(this.elementOptions=t,this.initFontOptions(t.font),tM.isValidLabel(t.label)?this.labelDirty=!0:t.label=void 0,void 0!==t.font&&null!==t.font)if("string"==typeof t.font)this.baseSize=this.fontOptions.size;else if("object"===QS(t.font)){var e=t.font.size;void 0!==e&&(this.baseSize=e);}}},{key:"initFontOptions",value:function(e){var i=this;us(bM,(function(t){i.fontOptions[t]={};})),t.parseFontString(this.fontOptions,e)?this.fontOptions.vadjust=0:us(e,(function(t,e){null!=t&&"object"!==QS(t)&&(i.fontOptions[e]=t);}));}},{key:"constrain",value:function(t){var e={constrainWidth:!1,maxWdt:-1,minWdt:-1,constrainHeight:!1,minHgt:-1,valign:"middle"},i=Ws(t,"widthConstraint");if("number"==typeof i)e.maxWdt=Number(i),e.minWdt=Number(i);else if("object"===QS(i)){var n=Ws(t,["widthConstraint","maximum"]);"number"==typeof n&&(e.maxWdt=Number(n));var o=Ws(t,["widthConstraint","minimum"]);"number"==typeof o&&(e.minWdt=Number(o));}var r=Ws(t,"heightConstraint");if("number"==typeof r)e.minHgt=Number(r);else if("object"===QS(r)){var s=Ws(t,["heightConstraint","minimum"]);"number"==typeof s&&(e.minHgt=Number(s));var a=Ws(t,["heightConstraint","valign"]);"string"==typeof a&&("top"!==a&&"bottom"!==a||(e.valign=a));}return e}},{key:"update",value:function(t,e){this.setOptions(t,!0),this.propagateFonts(e),es(this.fontOptions,this.constrain(e)),this.fontOptions.chooser=tM.choosify("label",e);}},{key:"adjustSizes",value:function(t){var e=t?t.right+t.left:0;this.fontOptions.constrainWidth&&(this.fontOptions.maxWdt-=e,this.fontOptions.minWdt-=e);var i=t?t.top+t.bottom:0;this.fontOptions.constrainHeight&&(this.fontOptions.minHgt-=i);}},{key:"addFontOptionsToPile",value:function(t,e){for(var i=0;i<e.length;++i)this.addFontToPile(t,e[i]);}},{key:"addFontToPile",value:function(t,e){if(void 0!==e&&void 0!==e.font&&null!==e.font){var i=e.font;t.push(i);}}},{key:"getBasicOptions",value:function(e){for(var i={},n=0;n<e.length;++n){var o=e[n],r={};t.parseFontString(r,o)&&(o=r),us(o,(function(t,e){void 0!==t&&(i.hasOwnProperty(e)||(-1!==yl(bM).call(bM,e)?i[e]={}:i[e]=t));}));}return i}},{key:"getFontOption",value:function(e,i,n){for(var o,r=0;r<e.length;++r){var s=e[r];if(s.hasOwnProperty(i)){if(null==(o=s[i]))continue;var a={};if(t.parseFontString(a,o)&&(o=a),o.hasOwnProperty(n))return o[n]}}if(this.fontOptions.hasOwnProperty(n))return this.fontOptions[n];throw new Error("Did not find value for multi-font for property: '"+n+"'")}},{key:"getFontOptions",value:function(t,e){for(var i={},n=["color","size","face","mod","vadjust"],o=0;o<n.length;++o){var r=n[o];i[r]=this.getFontOption(t,e,r);}return i}},{key:"propagateFonts",value:function(t){var e=this,i=[];this.addFontOptionsToPile(i,t),this.fontOptions=this.getBasicOptions(i);for(var n=function(t){var n=bM[t],o=e.fontOptions[n];us(e.getFontOptions(i,n),(function(t,e){o[e]=t;})),o.size=Number(o.size),o.vadjust=Number(o.vadjust);},o=0;o<bM.length;++o)n(o);}},{key:"draw",value:function(t,e,i,n,o){var r=arguments.length>5&&void 0!==arguments[5]?arguments[5]:"middle";if(void 0!==this.elementOptions.label){var s=this.fontOptions.size*this.body.view.scale;this.elementOptions.label&&s<this.elementOptions.scaling.label.drawThreshold-1||(s>=this.elementOptions.scaling.label.maxVisible&&(s=Number(this.elementOptions.scaling.label.maxVisible)/this.body.view.scale),this.calculateLabelSize(t,n,o,e,i,r),this._drawBackground(t),this._drawText(t,e,this.size.yLine,r,s));}}},{key:"_drawBackground",value:function(t){if(void 0!==this.fontOptions.background&&"none"!==this.fontOptions.background){t.fillStyle=this.fontOptions.background;var e=this.getSize();t.fillRect(e.left,e.top,e.width,e.height);}}},{key:"_drawText",value:function(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"middle",o=arguments.length>4?arguments[4]:void 0,r=this._setAlignment(t,e,i,n),s=US(r,2);e=s[0],i=s[1],t.textAlign="left",e-=this.size.width/2,this.fontOptions.valign&&this.size.height>this.size.labelHeight&&("top"===this.fontOptions.valign&&(i-=(this.size.height-this.size.labelHeight)/2),"bottom"===this.fontOptions.valign&&(i+=(this.size.height-this.size.labelHeight)/2));for(var a=0;a<this.lineCount;a++){var h=this.lines[a];if(h&&h.blocks){var l=0;this.isEdgeLabel||"center"===this.fontOptions.align?l+=(this.size.width-h.width)/2:"right"===this.fontOptions.align&&(l+=this.size.width-h.width);for(var d=0;d<h.blocks.length;d++){var u=h.blocks[d];t.font=u.font;var c=this._getColor(u.color,o,u.strokeColor),f=US(c,2),p=f[0],v=f[1];u.strokeWidth>0&&(t.lineWidth=u.strokeWidth,t.strokeStyle=v,t.lineJoin="round"),t.fillStyle=p,u.strokeWidth>0&&t.strokeText(u.text,e+l,i+u.vadjust),t.fillText(u.text,e+l,i+u.vadjust),l+=u.width;}i+=h.height;}}}},{key:"_setAlignment",value:function(t,e,i,n){if(this.isEdgeLabel&&"horizontal"!==this.fontOptions.align&&!1===this.pointToSelf){e=0,i=0;"top"===this.fontOptions.align?(t.textBaseline="alphabetic",i-=4):"bottom"===this.fontOptions.align?(t.textBaseline="hanging",i+=4):t.textBaseline="middle";}else t.textBaseline=n;return [e,i]}},{key:"_getColor",value:function(t,e,i){var n=t||"#000000",o=i||"#ffffff";if(e<=this.elementOptions.scaling.label.drawThreshold){var r=Math.max(0,Math.min(1,1-(this.elementOptions.scaling.label.drawThreshold-e)));n=ks(n,r),o=ks(o,r);}return [n,o]}},{key:"getTextSize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=arguments.length>2&&void 0!==arguments[2]&&arguments[2];return this._processLabel(t,e,i),{width:this.size.width,height:this.size.height,lineCount:this.lineCount}}},{key:"getSize",value:function(){var t=this.size.left,e=this.size.top-1;if(this.isEdgeLabel){var i=.5*-this.size.width;switch(this.fontOptions.align){case"middle":t=i,e=.5*-this.size.height;break;case"top":t=i,e=-(this.size.height+2);break;case"bottom":t=i,e=2;}}return {left:t,top:e,width:this.size.width,height:this.size.height}}},{key:"calculateLabelSize",value:function(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:0,o=arguments.length>4&&void 0!==arguments[4]?arguments[4]:0,r=arguments.length>5&&void 0!==arguments[5]?arguments[5]:"middle";this._processLabel(t,e,i),this.size.left=n-.5*this.size.width,this.size.top=o-.5*this.size.height,this.size.yLine=o+.5*(1-this.lineCount)*this.fontOptions.size,"hanging"===r&&(this.size.top+=.5*this.fontOptions.size,this.size.top+=4,this.size.yLine+=4);}},{key:"getFormattingValues",value:function(t,e,i,n){var o=function(t,e,i){return "normal"===e?"mod"===i?"":t[i]:void 0!==t[e][i]?t[e][i]:t[i]},r={color:o(this.fontOptions,n,"color"),size:o(this.fontOptions,n,"size"),face:o(this.fontOptions,n,"face"),mod:o(this.fontOptions,n,"mod"),vadjust:o(this.fontOptions,n,"vadjust"),strokeWidth:this.fontOptions.strokeWidth,strokeColor:this.fontOptions.strokeColor};(e||i)&&("normal"===n&&!0===this.fontOptions.chooser&&this.elementOptions.labelHighlightBold?r.mod="bold":"function"==typeof this.fontOptions.chooser&&this.fontOptions.chooser(r,this.elementOptions.id,e,i));var s="";return void 0!==r.mod&&""!==r.mod&&(s+=r.mod+" "),s+=r.size+"px "+r.face,t.font=s.replace(/"/g,""),r.font=t.font,r.height=r.size,r}},{key:"differentState",value:function(t,e){return t!==this.selectedState||e!==this.hoverState}},{key:"_processLabelText",value:function(t,e,i,n){return new mM(t,this,e,i).process(n)}},{key:"_processLabel",value:function(t,e,i){if(!1!==this.labelDirty||this.differentState(e,i)){var n=this._processLabelText(t,e,i,this.elementOptions.label);this.fontOptions.minWdt>0&&n.width<this.fontOptions.minWdt&&(n.width=this.fontOptions.minWdt),this.size.labelHeight=n.height,this.fontOptions.minHgt>0&&n.height<this.fontOptions.minHgt&&(n.height=this.fontOptions.minHgt),this.lines=n.lines,this.lineCount=n.lines.length,this.size.width=n.width,this.size.height=n.height,this.selectedState=e,this.hoverState=i,this.labelDirty=!1;}}},{key:"visible",value:function(){return 0!==this.size.width&&0!==this.size.height&&void 0!==this.elementOptions.label&&!(this.fontOptions.size*this.body.view.scale<this.elementOptions.scaling.label.drawThreshold-1)}}],[{key:"parseFontString",value:function(t,e){if(!e||"string"!=typeof e)return !1;var i=e.split(" ");return t.size=+i[0].replace("px",""),t.face=i[1],t.color=i[2],!0}}]),t}();var _M=function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t};var kM=function(t,e){return !e||"object"!==QS(e)&&"function"!=typeof e?_M(t):e},xM=r((function(){ka(1);}));W({target:"Object",stat:!0,forced:xM,sham:!ba},{getPrototypeOf:function(t){return ka(ma(t))}});var OM=F.Object.getPrototypeOf;W({target:"Object",stat:!0},{setPrototypeOf:ch});var SM=F.Object.setPrototypeOf,MM=i((function(t){function e(i){return t.exports=e=SM?OM:function(t){return t.__proto__||OM(t)},e(i)}t.exports=e;})),EM=ml,DM=i((function(t){function e(i,n){return t.exports=e=SM||function(t,e){return t.__proto__=e,t},e(i,n)}t.exports=e;}));var TM=function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=EM(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&DM(t,e);};W({target:"Array",proto:!0},{fill:function(t){for(var e=ma(this),i=ja(e.length),n=arguments.length,o=Ra(n>1?arguments[1]:void 0,i),r=n>2?arguments[2]:void 0,s=void 0===r?i:Ra(r,i);s>o;)e[o++]=t;return e}});var CM=X("Array").fill,PM=Array.prototype,AM=function(t){var e=t.fill;return t===PM||t instanceof Array&&e===PM.fill?CM:e},IM=function(){function t(e,i,n){kc(this,t),this.body=i,this.labelModule=n,this.setOptions(e),this.top=void 0,this.left=void 0,this.height=void 0,this.width=void 0,this.radius=void 0,this.margin=void 0,this.refreshNeeded=!0,this.boundingBox={top:0,left:0,right:0,bottom:0};}return Mc(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"_setMargins",value:function(t){this.margin={},this.options.margin&&("object"==QS(this.options.margin)?(this.margin.top=this.options.margin.top,this.margin.right=this.options.margin.right,this.margin.bottom=this.options.margin.bottom,this.margin.left=this.options.margin.left):(this.margin.top=this.options.margin,this.margin.right=this.options.margin,this.margin.bottom=this.options.margin,this.margin.left=this.options.margin)),t.adjustSizes(this.margin);}},{key:"_distanceToBorder",value:function(t,e){var i=this.options.borderWidth;return this.resize(t),Math.min(Math.abs(this.width/2/Math.cos(e)),Math.abs(this.height/2/Math.sin(e)))+i}},{key:"enableShadow",value:function(t,e){e.shadow&&(t.shadowColor=e.shadowColor,t.shadowBlur=e.shadowSize,t.shadowOffsetX=e.shadowX,t.shadowOffsetY=e.shadowY);}},{key:"disableShadow",value:function(t,e){e.shadow&&(t.shadowColor="rgba(0,0,0,0)",t.shadowBlur=0,t.shadowOffsetX=0,t.shadowOffsetY=0);}},{key:"enableBorderDashes",value:function(t,e){if(!1!==e.borderDashes)if(void 0!==t.setLineDash){var i=e.borderDashes;!0===i&&(i=[5,15]),t.setLineDash(i);}else console.warn("setLineDash is not supported in this browser. The dashed borders cannot be used."),this.options.shapeProperties.borderDashes=!1,e.borderDashes=!1;}},{key:"disableBorderDashes",value:function(t,e){!1!==e.borderDashes&&(void 0!==t.setLineDash?t.setLineDash([0]):(console.warn("setLineDash is not supported in this browser. The dashed borders cannot be used."),this.options.shapeProperties.borderDashes=!1,e.borderDashes=!1));}},{key:"needsRefresh",value:function(t,e){return !0===this.refreshNeeded?(this.refreshNeeded=!1,!0):void 0===this.width||this.labelModule.differentState(t,e)}},{key:"initContextForDraw",value:function(t,e){var i=e.borderWidth/this.body.view.scale;t.lineWidth=Math.min(this.width,i),t.strokeStyle=e.borderColor,t.fillStyle=e.color;}},{key:"performStroke",value:function(t,e){var i=e.borderWidth/this.body.view.scale;t.save(),i>0&&(this.enableBorderDashes(t,e),t.stroke(),this.disableBorderDashes(t,e)),t.restore();}},{key:"performFill",value:function(t,e){this.enableShadow(t,e),AM(t).call(t),this.disableShadow(t,e),this.performStroke(t,e);}},{key:"_addBoundingBoxMargin",value:function(t){this.boundingBox.left-=t,this.boundingBox.top-=t,this.boundingBox.bottom+=t,this.boundingBox.right+=t;}},{key:"_updateBoundingBox",value:function(t,e,i,n,o){void 0!==i&&this.resize(i,n,o),this.left=t-this.width/2,this.top=e-this.height/2,this.boundingBox.left=this.left,this.boundingBox.top=this.top,this.boundingBox.bottom=this.top+this.height,this.boundingBox.right=this.left+this.width;}},{key:"updateBoundingBox",value:function(t,e,i,n,o){this._updateBoundingBox(t,e,i,n,o);}},{key:"getDimensionsFromLabel",value:function(t,e,i){this.textSize=this.labelModule.getTextSize(t,e,i);var n=this.textSize.width,o=this.textSize.height;return 0===n&&(n=14,o=14),{width:n,height:o}}}]),t}(),FM=function(t){function e(t,i,n){var o;return kc(this,e),(o=kM(this,MM(e).call(this,t,i,n)))._setMargins(n),o}return TM(e,IM),Mc(e,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover;if(this.needsRefresh(e,i)){var n=this.getDimensionsFromLabel(t,e,i);this.width=n.width+this.margin.right+this.margin.left,this.height=n.height+this.margin.top+this.margin.bottom,this.radius=this.width/2;}}},{key:"draw",value:function(t,e,i,n,o,r){this.resize(t,n,o),this.left=e-this.width/2,this.top=i-this.height/2,this.initContextForDraw(t,r),Q(t,this.left,this.top,this.width,this.height,r.borderRadius),this.performFill(t,r),this.updateBoundingBox(e,i,t,n,o),this.labelModule.draw(t,this.left+this.textSize.width/2+this.margin.left,this.top+this.textSize.height/2+this.margin.top,n,o);}},{key:"updateBoundingBox",value:function(t,e,i,n,o){this._updateBoundingBox(t,e,i,n,o);var r=this.options.shapeProperties.borderRadius;this._addBoundingBoxMargin(r);}},{key:"distanceToBorder",value:function(t,e){this.resize(t);var i=this.options.borderWidth;return Math.min(Math.abs(this.width/2/Math.cos(e)),Math.abs(this.height/2/Math.sin(e)))+i}}]),e}(),NM=function(t){function e(t,i,n){var o;return kc(this,e),(o=kM(this,MM(e).call(this,t,i,n))).labelOffset=0,o.selected=!1,o}return TM(e,IM),Mc(e,[{key:"setOptions",value:function(t,e,i){this.options=t,void 0===e&&void 0===i||this.setImages(e,i);}},{key:"setImages",value:function(t,e){e&&this.selected?(this.imageObj=e,this.imageObjAlt=t):(this.imageObj=t,this.imageObjAlt=e);}},{key:"switchImages",value:function(t){var e=t&&!this.selected||!t&&this.selected;if(this.selected=t,void 0!==this.imageObjAlt&&e){var i=this.imageObj;this.imageObj=this.imageObjAlt,this.imageObjAlt=i;}}},{key:"_getImagePadding",value:function(){var t={top:0,right:0,bottom:0,left:0};if(this.options.imagePadding){var e=this.options.imagePadding;"object"==QS(e)?(t.top=e.top,t.right=e.right,t.bottom=e.bottom,t.left=e.left):(t.top=e,t.right=e,t.bottom=e,t.left=e);}return t}},{key:"_resizeImage",value:function(){var t,e;if(!1===this.options.shapeProperties.useImageSize){var i=1,n=1;this.imageObj.width&&this.imageObj.height&&(this.imageObj.width>this.imageObj.height?i=this.imageObj.width/this.imageObj.height:n=this.imageObj.height/this.imageObj.width),t=2*this.options.size*i,e=2*this.options.size*n;}else{var o=this._getImagePadding();t=this.imageObj.width+o.left+o.right,e=this.imageObj.height+o.top+o.bottom;}this.width=t,this.height=e,this.radius=.5*this.width;}},{key:"_drawRawCircle",value:function(t,e,i,n){this.initContextForDraw(t,n),J(t,e,i,n.size),this.performFill(t,n);}},{key:"_drawImageAtPosition",value:function(t,e){if(0!=this.imageObj.width){t.globalAlpha=1,this.enableShadow(t,e);var i=1;!0===this.options.shapeProperties.interpolation&&(i=this.imageObj.width/this.width/this.body.view.scale);var n=this._getImagePadding(),o=this.left+n.left,r=this.top+n.top,s=this.width-n.left-n.right,a=this.height-n.top-n.bottom;this.imageObj.drawImageAtPosition(t,i,o,r,s,a),this.disableShadow(t,e);}}},{key:"_drawImageLabel",value:function(t,e,i,n,o){var r,s=0;if(void 0!==this.height){s=.5*this.height;var a=this.labelModule.getTextSize(t,n,o);a.lineCount>=1&&(s+=a.height/2);}r=i+s,this.options.label&&(this.labelOffset=s),this.labelModule.draw(t,e,r,n,o,"hanging");}}]),e}(),jM=function(t){function e(t,i,n){var o;return kc(this,e),(o=kM(this,MM(e).call(this,t,i,n)))._setMargins(n),o}return TM(e,NM),Mc(e,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover;if(this.needsRefresh(e,i)){var n=this.getDimensionsFromLabel(t,e,i),o=Math.max(n.width+this.margin.right+this.margin.left,n.height+this.margin.top+this.margin.bottom);this.options.size=o/2,this.width=o,this.height=o,this.radius=this.width/2;}}},{key:"draw",value:function(t,e,i,n,o,r){this.resize(t,n,o),this.left=e-this.width/2,this.top=i-this.height/2,this._drawRawCircle(t,e,i,r),this.updateBoundingBox(e,i),this.labelModule.draw(t,this.left+this.textSize.width/2+this.margin.left,i,n,o);}},{key:"updateBoundingBox",value:function(t,e){this.boundingBox.top=e-this.options.size,this.boundingBox.left=t-this.options.size,this.boundingBox.right=t+this.options.size,this.boundingBox.bottom=e+this.options.size;}},{key:"distanceToBorder",value:function(t,e){return this.resize(t),.5*this.width}}]),e}(),zM=function(t){function e(t,i,n,o,r){var s;return kc(this,e),(s=kM(this,MM(e).call(this,t,i,n))).setImages(o,r),s}return TM(e,NM),Mc(e,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover,n=void 0===this.imageObj.src||void 0===this.imageObj.width||void 0===this.imageObj.height;if(n){var o=2*this.options.size;return this.width=o,this.height=o,void(this.radius=.5*this.width)}this.needsRefresh(e,i)&&this._resizeImage();}},{key:"draw",value:function(t,e,i,n,o,r){this.switchImages(n),this.resize(),this.left=e-this.width/2,this.top=i-this.height/2,this._drawRawCircle(t,e,i,r),t.save(),t.clip(),this._drawImageAtPosition(t,r),t.restore(),this._drawImageLabel(t,e,i,n,o),this.updateBoundingBox(e,i);}},{key:"updateBoundingBox",value:function(t,e){this.boundingBox.top=e-this.options.size,this.boundingBox.left=t-this.options.size,this.boundingBox.right=t+this.options.size,this.boundingBox.bottom=e+this.options.size,this.boundingBox.left=Math.min(this.boundingBox.left,this.labelModule.size.left),this.boundingBox.right=Math.max(this.boundingBox.right,this.labelModule.size.left+this.labelModule.size.width),this.boundingBox.bottom=Math.max(this.boundingBox.bottom,this.boundingBox.bottom+this.labelOffset);}},{key:"distanceToBorder",value:function(t,e){return this.resize(t),.5*this.width}}]),e}(),LM=function(t){function e(t,i,n){var o;return kc(this,e),(o=kM(this,MM(e).call(this,t,i,n)))._setMargins(n),o}return TM(e,IM),Mc(e,[{key:"resize",value:function(t,e,i){if(this.needsRefresh(e,i)){var n=this.getDimensionsFromLabel(t,e,i).width+this.margin.right+this.margin.left;this.width=n,this.height=n,this.radius=this.width/2;}}},{key:"draw",value:function(t,e,i,n,o,r){this.resize(t,n,o),this.left=e-this.width/2,this.top=i-this.height/2,this.initContextForDraw(t,r),et(t,e-this.width/2,i-this.height/2,this.width,this.height),this.performFill(t,r),this.updateBoundingBox(e,i,t,n,o),this.labelModule.draw(t,this.left+this.textSize.width/2+this.margin.left,this.top+this.textSize.height/2+this.margin.top,n,o);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),RM=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,IM),Mc(e,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover,n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{size:this.options.size};if(this.needsRefresh(e,i)){this.labelModule.getTextSize(t,e,i);var o=2*n.size;this.width=o,this.height=o,this.radius=.5*this.width;}}},{key:"_drawShape",value:function(t,e,i,n,o,r,s,a){var h;if(this.resize(t,r,s,a),this.left=n-this.width/2,this.top=o-this.height/2,this.initContextForDraw(t,a),(h=e,Object.prototype.hasOwnProperty.call(nt,h)?nt[h]:function(t){for(var e=arguments.length,i=new Array(e>1?e-1:0),n=1;n<e;n++)i[n-1]=arguments[n];CanvasRenderingContext2D.prototype[h].call(t,i);})(t,n,o,a.size),this.performFill(t,a),void 0!==this.options.icon&&void 0!==this.options.icon.code&&(t.font=(r?"bold ":"")+this.height/2+"px "+(this.options.icon.face||"FontAwesome"),t.fillStyle=this.options.icon.color||"black",t.textAlign="center",t.textBaseline="middle",t.fillText(this.options.icon.code,n,o)),void 0!==this.options.label){this.labelModule.calculateLabelSize(t,r,s,n,o,"hanging");var l=o+.5*this.height+.5*this.labelModule.size.height;this.labelModule.draw(t,n,l,r,s,"hanging");}this.updateBoundingBox(n,o);}},{key:"updateBoundingBox",value:function(t,e){this.boundingBox.top=e-this.options.size,this.boundingBox.left=t-this.options.size,this.boundingBox.right=t+this.options.size,this.boundingBox.bottom=e+this.options.size,void 0!==this.options.label&&this.labelModule.size.width>0&&(this.boundingBox.left=Math.min(this.boundingBox.left,this.labelModule.size.left),this.boundingBox.right=Math.max(this.boundingBox.right,this.labelModule.size.left+this.labelModule.size.width),this.boundingBox.bottom=Math.max(this.boundingBox.bottom,this.boundingBox.bottom+this.labelModule.size.height));}}]),e}(),BM=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,RM),Mc(e,[{key:"draw",value:function(t,e,i,n,o,r){this._drawShape(t,"diamond",4,e,i,n,o,r);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),YM=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,RM),Mc(e,[{key:"draw",value:function(t,e,i,n,o,r){this._drawShape(t,"circle",2,e,i,n,o,r);}},{key:"distanceToBorder",value:function(t,e){return this.resize(t),this.options.size}}]),e}(),HM=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,IM),Mc(e,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover;if(this.needsRefresh(e,i)){var n=this.getDimensionsFromLabel(t,e,i);this.height=2*n.height,this.width=n.width+n.height,this.radius=.5*this.width;}}},{key:"draw",value:function(t,e,i,n,o,r){this.resize(t,n,o),this.left=e-.5*this.width,this.top=i-.5*this.height,this.initContextForDraw(t,r),tt(t,this.left,this.top,this.width,this.height),this.performFill(t,r),this.updateBoundingBox(e,i,t,n,o),this.labelModule.draw(t,e,i,n,o);}},{key:"distanceToBorder",value:function(t,e){this.resize(t);var i=.5*this.width,n=.5*this.height,o=Math.sin(e)*i,r=Math.cos(e)*n;return i*n/Math.sqrt(o*o+r*r)}}]),e}(),WM=function(t){function e(t,i,n){var o;return kc(this,e),(o=kM(this,MM(e).call(this,t,i,n)))._setMargins(n),o}return TM(e,IM),Mc(e,[{key:"resize",value:function(t,e,i){this.needsRefresh(e,i)&&(this.iconSize={width:Number(this.options.icon.size),height:Number(this.options.icon.size)},this.width=this.iconSize.width+this.margin.right+this.margin.left,this.height=this.iconSize.height+this.margin.top+this.margin.bottom,this.radius=.5*this.width);}},{key:"draw",value:function(t,e,i,n,o,r){if(this.resize(t,n,o),this.options.icon.size=this.options.icon.size||50,this.left=e-this.width/2,this.top=i-this.height/2,this._icon(t,e,i,n,o,r),void 0!==this.options.label){this.labelModule.draw(t,this.left+this.iconSize.width/2+this.margin.left,i+this.height/2+5,n);}this.updateBoundingBox(e,i);}},{key:"updateBoundingBox",value:function(t,e){if(this.boundingBox.top=e-.5*this.options.icon.size,this.boundingBox.left=t-.5*this.options.icon.size,this.boundingBox.right=t+.5*this.options.icon.size,this.boundingBox.bottom=e+.5*this.options.icon.size,void 0!==this.options.label&&this.labelModule.size.width>0){this.boundingBox.left=Math.min(this.boundingBox.left,this.labelModule.size.left),this.boundingBox.right=Math.max(this.boundingBox.right,this.labelModule.size.left+this.labelModule.size.width),this.boundingBox.bottom=Math.max(this.boundingBox.bottom,this.boundingBox.bottom+this.labelModule.size.height+5);}}},{key:"_icon",value:function(t,e,i,n,o,r){var s=Number(this.options.icon.size);void 0!==this.options.icon.code?(t.font=[null!=this.options.icon.weight?this.options.icon.weight:n?"bold":"",(null!=this.options.icon.weight&&n?5:0)+s+"px",this.options.icon.face].join(" "),t.fillStyle=this.options.icon.color||"black",t.textAlign="center",t.textBaseline="middle",this.enableShadow(t,r),t.fillText(this.options.icon.code,e,i),this.disableShadow(t,r)):console.error("When using the icon shape, you need to define the code in the icon options object. This can be done per node or globally.");}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),VM=function(t){function e(t,i,n,o,r){var s;return kc(this,e),(s=kM(this,MM(e).call(this,t,i,n))).setImages(o,r),s}return TM(e,NM),Mc(e,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover,n=void 0===this.imageObj.src||void 0===this.imageObj.width||void 0===this.imageObj.height;if(n){var o=2*this.options.size;return this.width=o,void(this.height=o)}this.needsRefresh(e,i)&&this._resizeImage();}},{key:"draw",value:function(t,e,i,n,o,r){if(this.switchImages(n),this.resize(),this.left=e-this.width/2,this.top=i-this.height/2,!0===this.options.shapeProperties.useBorderWithImage){var s=this.options.borderWidth,a=this.options.borderWidthSelected||2*this.options.borderWidth,h=(n?a:s)/this.body.view.scale;t.lineWidth=Math.min(this.width,h),t.beginPath(),t.strokeStyle=n?this.options.color.highlight.border:o?this.options.color.hover.border:this.options.color.border,t.fillStyle=n?this.options.color.highlight.background:o?this.options.color.hover.background:this.options.color.background,t.rect(this.left-.5*t.lineWidth,this.top-.5*t.lineWidth,this.width+t.lineWidth,this.height+t.lineWidth),AM(t).call(t),this.performStroke(t,r),t.closePath();}this._drawImageAtPosition(t,r),this._drawImageLabel(t,e,i,n,o),this.updateBoundingBox(e,i);}},{key:"updateBoundingBox",value:function(t,e){this.resize(),this._updateBoundingBox(t,e),void 0!==this.options.label&&this.labelModule.size.width>0&&(this.boundingBox.left=Math.min(this.boundingBox.left,this.labelModule.size.left),this.boundingBox.right=Math.max(this.boundingBox.right,this.labelModule.size.left+this.labelModule.size.width),this.boundingBox.bottom=Math.max(this.boundingBox.bottom,this.boundingBox.bottom+this.labelOffset));}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),UM=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,RM),Mc(e,[{key:"draw",value:function(t,e,i,n,o,r){this._drawShape(t,"square",2,e,i,n,o,r);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),GM=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,RM),Mc(e,[{key:"draw",value:function(t,e,i,n,o,r){this._drawShape(t,"hexagon",4,e,i,n,o,r);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),qM=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,RM),Mc(e,[{key:"draw",value:function(t,e,i,n,o,r){this._drawShape(t,"star",4,e,i,n,o,r);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),XM=function(t){function e(t,i,n){var o;return kc(this,e),(o=kM(this,MM(e).call(this,t,i,n)))._setMargins(n),o}return TM(e,IM),Mc(e,[{key:"resize",value:function(t,e,i){this.needsRefresh(e,i)&&(this.textSize=this.labelModule.getTextSize(t,e,i),this.width=this.textSize.width+this.margin.right+this.margin.left,this.height=this.textSize.height+this.margin.top+this.margin.bottom,this.radius=.5*this.width);}},{key:"draw",value:function(t,e,i,n,o,r){this.resize(t,n,o),this.left=e-this.width/2,this.top=i-this.height/2,this.enableShadow(t,r),this.labelModule.draw(t,this.left+this.textSize.width/2+this.margin.left,this.top+this.textSize.height/2+this.margin.top,n,o),this.disableShadow(t,r),this.updateBoundingBox(e,i,t,n,o);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),ZM=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,RM),Mc(e,[{key:"draw",value:function(t,e,i,n,o,r){this._drawShape(t,"triangle",3,e,i,n,o,r);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),KM=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,RM),Mc(e,[{key:"draw",value:function(t,e,i,n,o,r){this._drawShape(t,"triangleDown",3,e,i,n,o,r);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),e}(),$M=Xa("JSON","stringify"),JM=/[\uD800-\uDFFF]/g,QM=/^[\uD800-\uDBFF]$/,tE=/^[\uDC00-\uDFFF]$/,eE=function(t,e,i){var n=i.charAt(e-1),o=i.charAt(e+1);return QM.test(t)&&!tE.test(o)||tE.test(t)&&!QM.test(n)?"\\u"+t.charCodeAt(0).toString(16):t},iE=r((function(){return '"\\udf06\\ud834"'!==$M("\udf06\ud834")||'"\\udead"'!==$M("\udead")}));$M&&W({target:"JSON",stat:!0,forced:iE},{stringify:function(t,e,i){var n=$M.apply(null,arguments);return "string"==typeof n?n.replace(JM,eE):n}}),F.JSON||(F.JSON={stringify:JSON.stringify});var nE,oE=function(t,e,i){return F.JSON.stringify.apply(null,arguments)},rE=!1,sE="background: #FFeeee; color: #dd0000",aE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"validate",value:function(e,i,n){rE=!1,nE=i;var o=i;return void 0!==n&&(o=i[n]),t.parse(e,o,[]),rE}},{key:"parse",value:function(e,i,n){for(var o in e)e.hasOwnProperty(o)&&t.check(o,e,i,n);}},{key:"check",value:function(e,i,n,o){if(void 0!==n[e]||void 0!==n.__any__){var r=e,s=!0;void 0===n[e]&&void 0!==n.__any__&&(r="__any__",s="object"===t.getType(i[e]));var a=n[r];s&&void 0!==a.__type__&&(a=a.__type__),t.checkFields(e,i,n,r,a,o);}else t.getSuggestion(e,n,o);}},{key:"checkFields",value:function(e,i,n,o,r,s){var a=function(i){console.log("%c"+i+t.printLocation(s,e),sE);},h=t.getType(i[e]),l=r[h];void 0!==l?"array"===t.getType(l)&&-1===yl(l).call(l,i[e])?(a('Invalid option detected in "'+e+'". Allowed values are:'+t.print(l)+' not "'+i[e]+'". '),rE=!0):"object"===h&&"__any__"!==o&&(s=os(s,e),t.parse(i[e],n[o],s)):void 0===r.any&&(a('Invalid type received for "'+e+'". Expected: '+t.print(kS(r))+". Received ["+h+'] "'+i[e]+'"'),rE=!0);}},{key:"getType",value:function(t){var e=QS(t);return "object"===e?null===t?"null":t instanceof Boolean?"boolean":t instanceof Number?"number":t instanceof String?"string":Yh(t)?"array":t instanceof Date?"date":void 0!==t.nodeType?"dom":!0===t._isAMomentObject?"moment":"object":"number"===e?"number":"boolean"===e?"boolean":"string"===e?"string":void 0===e?"undefined":e}},{key:"getSuggestion",value:function(e,i,n){var o,r=t.findInOptions(e,i,n,!1),s=t.findInOptions(e,nE,[],!0);o=void 0!==r.indexMatch?" in "+t.printLocation(r.path,e,"")+'Perhaps it was incomplete? Did you mean: "'+r.indexMatch+'"?\n\n':s.distance<=4&&r.distance>s.distance?" in "+t.printLocation(r.path,e,"")+"Perhaps it was misplaced? Matching option found at: "+t.printLocation(s.path,s.closestMatch,""):r.distance<=8?'. Did you mean "'+r.closestMatch+'"?'+t.printLocation(r.path,e):". Did you mean one of these: "+t.print(kS(i))+t.printLocation(n,e),console.log('%cUnknown option detected: "'+e+'"'+o,sE),rE=!0;}},{key:"findInOptions",value:function(e,i,n){var o=arguments.length>3&&void 0!==arguments[3]&&arguments[3],r=1e9,s="",a=[],h=e.toLowerCase(),l=void 0;for(var d in i){var u=void 0;if(void 0!==i[d].__type__&&!0===o){var c=t.findInOptions(e,i[d],os(n,d));r>c.distance&&(s=c.closestMatch,a=c.path,r=c.distance,l=c.indexMatch);}else{var f;-1!==yl(f=d.toLowerCase()).call(f,h)&&(l=d),r>(u=t.levenshteinDistance(e,d))&&(s=d,a=rs(n),r=u);}}return {closestMatch:s,path:a,distance:r,indexMatch:l}}},{key:"printLocation",value:function(t,e){for(var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"Problem value found at: \n",n="\n\n"+i+"options = {\n",o=0;o<t.length;o++){for(var r=0;r<o+1;r++)n+="  ";n+=t[o]+": {\n";}for(var s=0;s<t.length+1;s++)n+="  ";n+=e+"\n";for(var a=0;a<t.length+1;a++){for(var h=0;h<t.length-a;h++)n+="  ";n+="}\n";}return n+"\n\n"}},{key:"print",value:function(t){return oE(t).replace(/(\")|(\[)|(\])|(,"__type__")/g,"").replace(/(\,)/g,", ")}},{key:"levenshteinDistance",value:function(t,e){if(0===t.length)return e.length;if(0===e.length)return t.length;var i,n,o=[];for(i=0;i<=e.length;i++)o[i]=[i];for(n=0;n<=t.length;n++)o[0][n]=n;for(i=1;i<=e.length;i++)for(n=1;n<=t.length;n++)e.charAt(i-1)==t.charAt(n-1)?o[i][n]=o[i-1][n-1]:o[i][n]=Math.min(o[i-1][n-1]+1,Math.min(o[i][n-1]+1,o[i-1][n]+1));return o[e.length][t.length]}}]),t}();function hE(t,e){var i=kS(t);if(wS){var n=wS(t);e&&(n=zO(n).call(n,(function(e){return PO(t,e).enumerable}))),i.push.apply(i,n);}return i}var lE=function(){function t(e,i,n,o,r,s){kc(this,t),this.options=js(r),this.globalOptions=r,this.defaultOptions=s,this.body=i,this.edges=[],this.id=void 0,this.imagelist=n,this.grouplist=o,this.x=void 0,this.y=void 0,this.baseSize=this.options.size,this.baseFontSize=this.options.font.size,this.predefinedPosition=!1,this.selected=!1,this.hover=!1,this.labelModule=new wM(this.body,this.options,!1),this.setOptions(e);}return Mc(t,[{key:"attachEdge",value:function(t){var e;-1===yl(e=this.edges).call(e,t)&&this.edges.push(t);}},{key:"detachEdge",value:function(t){var e,i,n=yl(e=this.edges).call(e,t);-1!=n&&tl(i=this.edges).call(i,n,1);}},{key:"setOptions",value:function(e){var i=this.options.shape;if(e){if(void 0!==e.color&&(this._localColor=e.color),void 0!==e.id&&(this.id=e.id),void 0===this.id)throw new Error("Node must have an id");t.checkMass(e,this.id),void 0!==e.x&&(null===e.x?(this.x=void 0,this.predefinedPosition=!1):(this.x=LS(e.x),this.predefinedPosition=!0)),void 0!==e.y&&(null===e.y?(this.y=void 0,this.predefinedPosition=!1):(this.y=LS(e.y),this.predefinedPosition=!0)),void 0!==e.size&&(this.baseSize=e.size),void 0!==e.value&&(e.value=IS(e.value)),t.parseOptions(this.options,e,!0,this.globalOptions,this.grouplist);var n=[e,this.options,this.defaultOptions];return this.chooser=tM.choosify("node",n),this._load_images(),this.updateLabelModule(e),this.updateShape(i),void 0!==e.hidden||void 0!==e.physics}}},{key:"_load_images",value:function(){if(("circularImage"===this.options.shape||"image"===this.options.shape)&&void 0===this.options.image)throw new Error("Option image must be defined for node type '"+this.options.shape+"'");if(void 0!==this.options.image){if(void 0===this.imagelist)throw new Error("Internal Error: No images provided");if("string"==typeof this.options.image)this.imageObj=this.imagelist.load(this.options.image,this.options.brokenImage,this.id);else{if(void 0===this.options.image.unselected)throw new Error("No unselected image provided");this.imageObj=this.imagelist.load(this.options.image.unselected,this.options.brokenImage,this.id),void 0!==this.options.image.selected?this.imageObjAlt=this.imagelist.load(this.options.image.selected,this.options.brokenImage,this.id):this.imageObjAlt=void 0;}}}},{key:"getFormattingValues",value:function(){var t={color:this.options.color.background,borderWidth:this.options.borderWidth,borderColor:this.options.color.border,size:this.options.size,borderDashes:this.options.shapeProperties.borderDashes,borderRadius:this.options.shapeProperties.borderRadius,shadow:this.options.shadow.enabled,shadowColor:this.options.shadow.color,shadowSize:this.options.shadow.size,shadowX:this.options.shadow.x,shadowY:this.options.shadow.y};return this.selected||this.hover?!0===this.chooser?this.selected?(t.borderWidth*=2,t.color=this.options.color.highlight.background,t.borderColor=this.options.color.highlight.border,t.shadow=this.options.shadow.enabled):this.hover&&(t.color=this.options.color.hover.background,t.borderColor=this.options.color.hover.border,t.shadow=this.options.shadow.enabled):"function"==typeof this.chooser&&(this.chooser(t,this.options.id,this.selected,this.hover),!1===t.shadow&&(t.shadowColor===this.options.shadow.color&&t.shadowSize===this.options.shadow.size&&t.shadowX===this.options.shadow.x&&t.shadowY===this.options.shadow.y||(t.shadow=!0))):t.shadow=this.options.shadow.enabled,t}},{key:"updateLabelModule",value:function(e){void 0!==this.options.label&&null!==this.options.label||(this.options.label=""),t.updateGroupOptions(this.options,function(t){for(var e=1;e<arguments.length;e++){var i,n=null!=arguments[e]?arguments[e]:{};if(e%2)zh(i=hE(Object(n),!0)).call(i,(function(e){xS(t,e,n[e]);}));else if(EO)kO(t,EO(n));else{var o;zh(o=hE(Object(n))).call(o,(function(e){_O(t,e,PO(n,e));}));}}return t}({},e,{color:e&&e.color||this._localColor||void 0}),this.grouplist);var i=this.grouplist.get(this.options.group,!1),n=[e,this.options,i,this.globalOptions,this.defaultOptions];this.labelModule.update(this.options,n),void 0!==this.labelModule.baseSize&&(this.baseFontSize=this.labelModule.baseSize);}},{key:"updateShape",value:function(t){if(t===this.options.shape&&this.shape)this.shape.setOptions(this.options,this.imageObj,this.imageObjAlt);else switch(this.options.shape){case"box":this.shape=new FM(this.options,this.body,this.labelModule);break;case"circle":this.shape=new jM(this.options,this.body,this.labelModule);break;case"circularImage":this.shape=new zM(this.options,this.body,this.labelModule,this.imageObj,this.imageObjAlt);break;case"database":this.shape=new LM(this.options,this.body,this.labelModule);break;case"diamond":this.shape=new BM(this.options,this.body,this.labelModule);break;case"dot":this.shape=new YM(this.options,this.body,this.labelModule);break;case"ellipse":this.shape=new HM(this.options,this.body,this.labelModule);break;case"icon":this.shape=new WM(this.options,this.body,this.labelModule);break;case"image":this.shape=new VM(this.options,this.body,this.labelModule,this.imageObj,this.imageObjAlt);break;case"square":this.shape=new UM(this.options,this.body,this.labelModule);break;case"hexagon":this.shape=new GM(this.options,this.body,this.labelModule);break;case"star":this.shape=new qM(this.options,this.body,this.labelModule);break;case"text":this.shape=new XM(this.options,this.body,this.labelModule);break;case"triangle":this.shape=new ZM(this.options,this.body,this.labelModule);break;case"triangleDown":this.shape=new KM(this.options,this.body,this.labelModule);break;default:this.shape=new HM(this.options,this.body,this.labelModule);}this.needsRefresh();}},{key:"select",value:function(){this.selected=!0,this.needsRefresh();}},{key:"unselect",value:function(){this.selected=!1,this.needsRefresh();}},{key:"needsRefresh",value:function(){this.shape.refreshNeeded=!0;}},{key:"getTitle",value:function(){return this.options.title}},{key:"distanceToBorder",value:function(t,e){return this.shape.distanceToBorder(t,e)}},{key:"isFixed",value:function(){return this.options.fixed.x&&this.options.fixed.y}},{key:"isSelected",value:function(){return this.selected}},{key:"getValue",value:function(){return this.options.value}},{key:"getLabelSize",value:function(){return this.labelModule.size()}},{key:"setValueRange",value:function(t,e,i){if(void 0!==this.options.value){var n=this.options.scaling.customScalingFunction(t,e,i,this.options.value),o=this.options.scaling.max-this.options.scaling.min;if(!0===this.options.scaling.label.enabled){var r=this.options.scaling.label.max-this.options.scaling.label.min;this.options.font.size=this.options.scaling.label.min+n*r;}this.options.size=this.options.scaling.min+n*o;}else this.options.size=this.baseSize,this.options.font.size=this.baseFontSize;this.updateLabelModule();}},{key:"draw",value:function(t){var e=this.getFormattingValues();this.shape.draw(t,this.x,this.y,this.selected,this.hover,e);}},{key:"updateBoundingBox",value:function(t){this.shape.updateBoundingBox(this.x,this.y,t);}},{key:"resize",value:function(t){var e=this.getFormattingValues();this.shape.resize(t,this.selected,this.hover,e);}},{key:"getItemsOnPoint",value:function(t){var e=[];return this.labelModule.visible()&&tM.pointInRect(this.labelModule.getSize(),t)&&e.push({nodeId:this.id,labelId:0}),tM.pointInRect(this.shape.boundingBox,t)&&e.push({nodeId:this.id}),e}},{key:"isOverlappingWith",value:function(t){return this.shape.left<t.right&&this.shape.left+this.shape.width>t.left&&this.shape.top<t.bottom&&this.shape.top+this.shape.height>t.top}},{key:"isBoundingBoxOverlappingWith",value:function(t){return this.shape.boundingBox.left<t.right&&this.shape.boundingBox.right>t.left&&this.shape.boundingBox.top<t.bottom&&this.shape.boundingBox.bottom>t.top}}],[{key:"updateGroupOptions",value:function(t,e,i){if(void 0!==i){var n=t.group;if(void 0!==e&&void 0!==e.group&&n!==e.group)throw new Error("updateGroupOptions: group values in options don't match.");if("number"==typeof n||"string"==typeof n&&""!=n){var o=i.get(n),r=["font"];void 0!==e&&void 0!==e.color&&null!=e.color&&r.push("color"),ts(r,t,o),t.color=Os(t.color);}}}},{key:"parseOptions",value:function(e,i){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2],o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{},r=arguments.length>4?arguments[4]:void 0,s=["color","fixed","shadow"];if(ts(s,e,i,n),t.checkMass(i),Ls(e,i,"shadow",o),void 0!==i.color&&null!==i.color){var a=Os(i.color);Kr(e.color,a);}else!0===n&&null===i.color&&(e.color=js(o.color));void 0!==i.fixed&&null!==i.fixed&&("boolean"==typeof i.fixed?(e.fixed.x=i.fixed,e.fixed.y=i.fixed):(void 0!==i.fixed.x&&"boolean"==typeof i.fixed.x&&(e.fixed.x=i.fixed.x),void 0!==i.fixed.y&&"boolean"==typeof i.fixed.y&&(e.fixed.y=i.fixed.y))),!0===n&&null===i.font&&(e.font=js(o.font)),t.updateGroupOptions(e,i,r),void 0!==i.scaling&&Ls(e.scaling,i.scaling,"label",o.scaling);}},{key:"checkMass",value:function(t,e){if(void 0!==t.mass&&t.mass<=0){var i="";void 0!==e&&(i=" in node id: "+e),console.log("%cNegative or zero mass disallowed"+i+", setting mass to 1.",sE),t.mass=1;}}}]),t}(),dE=function(){function t(e,i,n,o){var r,s=this;if(kc(this,t),this.body=e,this.images=i,this.groups=n,this.layoutEngine=o,this.body.functions.createNode=$(r=this.create).call(r,this),this.nodesListeners={add:function(t,e){s.add(e.items);},update:function(t,e){s.update(e.items,e.data,e.oldData);},remove:function(t,e){s.remove(e.items);}},this.defaultOptions={borderWidth:1,borderWidthSelected:2,brokenImage:void 0,color:{border:"#2B7CE9",background:"#97C2FC",highlight:{border:"#2B7CE9",background:"#D2E5FF"},hover:{border:"#2B7CE9",background:"#D2E5FF"}},fixed:{x:!1,y:!1},font:{color:"#343434",size:14,face:"arial",background:"none",strokeWidth:0,strokeColor:"#ffffff",align:"center",vadjust:0,multi:!1,bold:{mod:"bold"},boldital:{mod:"bold italic"},ital:{mod:"italic"},mono:{mod:"",size:15,face:"monospace",vadjust:2}},group:void 0,hidden:!1,icon:{face:"FontAwesome",code:void 0,size:50,color:"#2B7CE9"},image:void 0,imagePadding:{top:0,right:0,bottom:0,left:0},label:void 0,labelHighlightBold:!0,level:void 0,margin:{top:5,right:5,bottom:5,left:5},mass:1,physics:!0,scaling:{min:10,max:30,label:{enabled:!1,min:14,max:30,maxVisible:30,drawThreshold:5},customScalingFunction:function(t,e,i,n){if(e===t)return .5;var o=1/(e-t);return Math.max(0,(n-t)*o)}},shadow:{enabled:!1,color:"rgba(0,0,0,0.5)",size:10,x:5,y:5},shape:"ellipse",shapeProperties:{borderDashes:!1,borderRadius:6,interpolation:!0,useImageSize:!1,useBorderWithImage:!1},size:25,title:void 0,value:void 0,x:void 0,y:void 0},this.defaultOptions.mass<=0)throw "Internal error: mass in defaultOptions of NodesHandler may not be zero or negative";this.options=js(this.defaultOptions),this.bindEventListeners();}return Mc(t,[{key:"bindEventListeners",value:function(){var t,e,i=this;this.body.emitter.on("refreshNodes",$(t=this.refresh).call(t,this)),this.body.emitter.on("refresh",$(e=this.refresh).call(e,this)),this.body.emitter.on("destroy",(function(){us(i.nodesListeners,(function(t,e){i.body.data.nodes&&i.body.data.nodes.off(e,t);})),delete i.body.functions.createNode,delete i.nodesListeners.add,delete i.nodesListeners.update,delete i.nodesListeners.remove,delete i.nodesListeners;}));}},{key:"setOptions",value:function(t){if(void 0!==t){if(lE.parseOptions(this.options,t),void 0!==t.shape)for(var e in this.body.nodes)this.body.nodes.hasOwnProperty(e)&&this.body.nodes[e].updateShape();if(void 0!==t.font)for(var i in this.body.nodes)this.body.nodes.hasOwnProperty(i)&&(this.body.nodes[i].updateLabelModule(),this.body.nodes[i].needsRefresh());if(void 0!==t.size)for(var n in this.body.nodes)this.body.nodes.hasOwnProperty(n)&&this.body.nodes[n].needsRefresh();void 0===t.hidden&&void 0===t.physics||this.body.emitter.emit("_dataChanged");}}},{key:"setData",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=this.body.data.nodes;if(t instanceof gO||t instanceof mO)this.body.data.nodes=t;else if(Yh(t))this.body.data.nodes=new gO,this.body.data.nodes.add(t);else{if(t)throw new TypeError("Array or DataSet expected");this.body.data.nodes=new gO;}if(i&&us(this.nodesListeners,(function(t,e){i.off(e,t);})),this.body.nodes={},this.body.data.nodes){var n=this;us(this.nodesListeners,(function(t,e){n.body.data.nodes.on(e,t);}));var o=this.body.data.nodes.getIds();this.add(o,!0);}!1===e&&this.body.emitter.emit("_dataChanged");}},{key:"add",value:function(t){for(var e,i=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=[],o=0;o<t.length;o++){e=t[o];var r=this.body.data.nodes.get(e),s=this.create(r);n.push(s),this.body.nodes[e]=s;}this.layoutEngine.positionInitially(n),!1===i&&this.body.emitter.emit("_dataChanged");}},{key:"update",value:function(t,e,i){for(var n=this.body.nodes,o=!1,r=0;r<t.length;r++){var s=t[r],a=n[s],h=e[r];void 0!==a?a.setOptions(h)&&(o=!0):(o=!0,a=this.create(h),n[s]=a);}o||void 0===i||(o=Vc(e).call(e,(function(t,e){var n=i[e];return n&&n.level!==t.level}))),!0===o?this.body.emitter.emit("_dataChanged"):this.body.emitter.emit("_dataUpdated");}},{key:"remove",value:function(t){for(var e=this.body.nodes,i=0;i<t.length;i++){delete e[t[i]];}this.body.emitter.emit("_dataChanged");}},{key:"create",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:lE;return new e(t,this.body,this.images,this.groups,this.options,this.defaultOptions)}},{key:"refresh",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];us(this.body.nodes,(function(i,n){var o=t.body.data.nodes.get(n);void 0!==o&&(!0===e&&i.setOptions({x:null,y:null}),i.setOptions({fixed:!1}),i.setOptions(o));}));}},{key:"getPositions",value:function(t){var e={};if(void 0!==t){if(!0===Yh(t)){for(var i=0;i<t.length;i++)if(void 0!==this.body.nodes[t[i]]){var n=this.body.nodes[t[i]];e[t[i]]={x:Math.round(n.x),y:Math.round(n.y)};}}else if(void 0!==this.body.nodes[t]){var o=this.body.nodes[t];e[t]={x:Math.round(o.x),y:Math.round(o.y)};}}else for(var r=0;r<this.body.nodeIndices.length;r++){var s=this.body.nodes[this.body.nodeIndices[r]];e[this.body.nodeIndices[r]]={x:Math.round(s.x),y:Math.round(s.y)};}return e}},{key:"storePositions",value:function(){var t=[],e=this.body.data.nodes.getDataSet(),i=!0,n=!1,o=void 0;try{for(var r,s=Bc(e.get());!(i=(r=s.next()).done);i=!0){var a=r.value,h=a.id,l=this.body.nodes[h],d=Math.round(l.x),u=Math.round(l.y);a.x===d&&a.y===u||t.push({id:h,x:d,y:u});}}catch(t){n=!0,o=t;}finally{try{i||null==s.return||s.return();}finally{if(n)throw o}}e.update(t);}},{key:"getBoundingBox",value:function(t){if(void 0!==this.body.nodes[t])return this.body.nodes[t].shape.boundingBox}},{key:"getConnectedNodes",value:function(t,e){var i=[];if(void 0!==this.body.nodes[t])for(var n=this.body.nodes[t],o={},r=0;r<n.edges.length;r++){var s=n.edges[r];"to"!==e&&s.toId==n.id?void 0===o[s.fromId]&&(i.push(s.fromId),o[s.fromId]=!0):"from"!==e&&s.fromId==n.id&&void 0===o[s.toId]&&(i.push(s.toId),o[s.toId]=!0);}return i}},{key:"getConnectedEdges",value:function(t){var e=[];if(void 0!==this.body.nodes[t])for(var i=this.body.nodes[t],n=0;n<i.edges.length;n++)e.push(i.edges[n].id);else console.log("NodeId provided for getConnectedEdges does not exist. Provided: ",t);return e}},{key:"moveNode",value:function(t,e,i){var n=this;void 0!==this.body.nodes[t]?(this.body.nodes[t].x=Number(e),this.body.nodes[t].y=Number(i),Ic((function(){n.body.emitter.emit("startSimulation");}),0)):console.log("Node id supplied to moveNode does not exist. Provided: ",t);}}]),t}(),uE=CO;W({target:"Reflect",stat:!0},{get:function t(e,i){var n,o,r=arguments.length<3?e:arguments[2];return z(e)===r?e[i]:(n=M.f(e,i))?w(n,"value")?n.value:void 0===n.get?void 0:n.get.call(r):g(o=ka(e))?t(o,i,r):void 0}});var cE=F.Reflect.get;var fE=function(t,e){for(;!Object.prototype.hasOwnProperty.call(t,e)&&null!==(t=MM(t)););return t},pE=i((function(t){function e(i,n,o){return "undefined"!=typeof Reflect&&cE?t.exports=e=cE:t.exports=e=function(t,e,i){var n=fE(t,e);if(n){var o=uE(n,e);return o.get?o.get.call(i):o.value}},e(i,n,o||i)}t.exports=e;})),vE=Math.hypot,yE=Math.abs,gE=Math.sqrt,mE=!!vE&&vE(1/0,NaN)!==1/0;W({target:"Math",stat:!0,forced:mE},{hypot:function(t,e){for(var i,n,o=0,r=0,s=arguments.length,a=0;r<s;)a<(i=yE(arguments[r++]))?(o=o*(n=a/i)*n+1,a=i):o+=i>0?(n=i/a)*n:i;return a===1/0?1/0:a*gE(o)}});var bE=F.Math.hypot,wE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"transform",value:function(t,e){Yh(t)||(t=[t]);for(var i=e.point.x,n=e.point.y,o=e.angle,r=e.length,s=0;s<t.length;++s){var a=t[s],h=a.x*Math.cos(o)-a.y*Math.sin(o),l=a.x*Math.sin(o)+a.y*Math.cos(o);a.x=i+r*h,a.y=n+r*l;}}},{key:"drawPath",value:function(t,e){t.beginPath(),t.moveTo(e[0].x,e[0].y);for(var i=1;i<e.length;++i)t.lineTo(e[i].x,e[i].y);t.closePath();}}]),t}(),_E=function(t){function e(){return kc(this,e),kM(this,MM(e).apply(this,arguments))}return TM(e,wE),Mc(e,null,[{key:"draw",value:function(t,e){if(e.image){t.save(),t.translate(e.point.x,e.point.y),t.rotate(Math.PI/2+e.angle);var i=null!=e.imageWidth?e.imageWidth:e.image.width,n=null!=e.imageHeight?e.imageHeight:e.image.height;e.image.drawImageAtPosition(t,1,-i/2,0,i,n),t.restore();}return !1}}]),e}(),kE=function(t){function e(){return kc(this,e),kM(this,MM(e).apply(this,arguments))}return TM(e,wE),Mc(e,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:0},{x:-1,y:.3},{x:-.9,y:0},{x:-1,y:-.3}];return wE.transform(i,e),wE.drawPath(t,i),!0}}]),e}(),xE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i=[{x:-1,y:0},{x:0,y:.3},{x:-.4,y:0},{x:0,y:-.3}];return wE.transform(i,e),wE.drawPath(t,i),!0}}]),t}(),OE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i={x:-.4,y:0};wE.transform(i,e),t.strokeStyle=t.fillStyle,t.fillStyle="rgba(0, 0, 0, 0)";var n=Math.PI,o=e.angle-n/2,r=e.angle+n/2;return t.beginPath(),t.arc(i.x,i.y,.4*e.length,o,r,!1),t.stroke(),!0}}]),t}(),SE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i={x:-.3,y:0};wE.transform(i,e),t.strokeStyle=t.fillStyle,t.fillStyle="rgba(0, 0, 0, 0)";var n=Math.PI,o=e.angle+n/2,r=e.angle+3*n/2;return t.beginPath(),t.arc(i.x,i.y,.4*e.length,o,r,!1),t.stroke(),!0}}]),t}(),ME=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i=[{x:.02,y:0},{x:-1,y:.3},{x:-1,y:-.3}];return wE.transform(i,e),wE.drawPath(t,i),!0}}]),t}(),EE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:.3},{x:0,y:-.3},{x:-1,y:0}];return wE.transform(i,e),wE.drawPath(t,i),!0}}]),t}(),DE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i={x:-.4,y:0};return wE.transform(i,e),J(t,i.x,i.y,.4*e.length),!0}}]),t}(),TE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:.5},{x:0,y:-.5},{x:-.15,y:-.5},{x:-.15,y:.5}];return wE.transform(i,e),wE.drawPath(t,i),!0}}]),t}(),CE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:.3},{x:0,y:-.3},{x:-.6,y:-.3},{x:-.6,y:.3}];return wE.transform(i,e),wE.drawPath(t,i),!0}}]),t}(),PE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:0},{x:-.5,y:-.3},{x:-1,y:0},{x:-.5,y:.3}];return wE.transform(i,e),wE.drawPath(t,i),!0}}]),t}(),AE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i=[{x:-1,y:.3},{x:-.5,y:0},{x:-1,y:-.3},{x:0,y:0}];return wE.transform(i,e),wE.drawPath(t,i),!0}}]),t}(),IE=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"draw",value:function(t,e){var i;switch(e.type&&(i=e.type.toLowerCase()),i){case"image":return _E.draw(t,e);case"circle":return DE.draw(t,e);case"box":return CE.draw(t,e);case"crow":return xE.draw(t,e);case"curve":return OE.draw(t,e);case"diamond":return PE.draw(t,e);case"inv_curve":return SE.draw(t,e);case"triangle":return ME.draw(t,e);case"inv_triangle":return EE.draw(t,e);case"bar":return TE.draw(t,e);case"vee":return AE.draw(t,e);case"arrow":default:return kE.draw(t,e)}}}]),t}();function FE(t,e){var i=kS(t);if(wS){var n=wS(t);e&&(n=zO(n).call(n,(function(e){return PO(t,e).enumerable}))),i.push.apply(i,n);}return i}var NE=function(){function t(e,i,n){kc(this,t),this._body=i,this._labelModule=n,this.color={},this.colorDirty=!0,this.hoverWidth=1.5,this.selectionWidth=2,this.setOptions(e),this.fromPoint=this.from,this.toPoint=this.to;}return Mc(t,[{key:"connect",value:function(){this.from=this._body.nodes[this.options.from],this.to=this._body.nodes[this.options.to];}},{key:"cleanup",value:function(){return !1}},{key:"setOptions",value:function(t){this.options=t,this.from=this._body.nodes[this.options.from],this.to=this._body.nodes[this.options.to],this.id=this.options.id;}},{key:"drawLine",value:function(t,e,i,n){var o=arguments.length>4&&void 0!==arguments[4]?arguments[4]:this.getViaNode();t.strokeStyle=this.getColor(t,e),t.lineWidth=e.width,!1!==e.dashes?this._drawDashedLine(t,e,o):this._drawLine(t,e,o);}},{key:"_drawLine",value:function(t,e,i,n,o){if(this.from!=this.to)this._line(t,e,i,n,o);else{var r=this._getCircleData(t),s=US(r,3),a=s[0],h=s[1],l=s[2];this._circle(t,e,a,h,l);}}},{key:"_drawDashedLine",value:function(t,e,i,n,o){t.lineCap="round";var r=Yh(e.dashes)?e.dashes:[5,5];if(void 0!==t.setLineDash){if(t.save(),t.setLineDash(r),t.lineDashOffset=0,this.from!=this.to)this._line(t,e,i);else{var s=this._getCircleData(t),a=US(s,3),h=a[0],l=a[1],d=a[2];this._circle(t,e,h,l,d);}t.setLineDash([0]),t.lineDashOffset=0,t.restore();}else{if(this.from!=this.to)it(t,this.from.x,this.from.y,this.to.x,this.to.y,r);else{var u=this._getCircleData(t),c=US(u,3),f=c[0],p=c[1],v=c[2];this._circle(t,e,f,p,v);}this.enableShadow(t,e),t.stroke(),this.disableShadow(t,e);}}},{key:"findBorderPosition",value:function(t,e,i){return this.from!=this.to?this._findBorderPosition(t,e,i):this._findBorderPositionCircle(t,e,i)}},{key:"findBorderPositions",value:function(t){if(this.from!=this.to)return {from:this._findBorderPosition(this.from,t),to:this._findBorderPosition(this.to,t)};var e,i=sM(e=this._getCircleData(t)).call(e,0,2),n=US(i,2),o=n[0],r=n[1];return {from:this._findBorderPositionCircle(this.from,t,{x:o,y:r,low:.25,high:.6,direction:-1}),to:this._findBorderPositionCircle(this.from,t,{x:o,y:r,low:.6,high:.8,direction:1})}}},{key:"_getCircleData",value:function(t){var e,i,n=this.from,o=this.options.selfReferenceSize;return void 0!==t&&void 0===n.shape.width&&n.shape.resize(t),n.shape.width>n.shape.height?(e=n.x+.5*n.shape.width,i=n.y-o):(e=n.x+o,i=n.y-.5*n.shape.height),[e,i,o]}},{key:"_pointOnCircle",value:function(t,e,i,n){var o=2*n*Math.PI;return {x:t+i*Math.cos(o),y:e-i*Math.sin(o)}}},{key:"_findBorderPositionCircle",value:function(t,e,i){var n,o=i.x,r=i.y,s=i.low,a=i.high,h=i.direction,l=this.options.selfReferenceSize,d=.5*(s+a),u=0;do{d=.5*(s+a),n=this._pointOnCircle(o,r,l,d);var c=Math.atan2(t.y-n.y,t.x-n.x),f=t.distanceToBorder(e,c)-Math.sqrt(Math.pow(n.x-t.x,2)+Math.pow(n.y-t.y,2));if(Math.abs(f)<.05)break;f>0?h>0?s=d:a=d:h>0?a=d:s=d,++u;}while(s<=a&&u<10);return function(t){for(var e=1;e<arguments.length;e++){var i,n=null!=arguments[e]?arguments[e]:{};if(e%2)zh(i=FE(Object(n),!0)).call(i,(function(e){xS(t,e,n[e]);}));else if(EO)kO(t,EO(n));else{var o;zh(o=FE(Object(n))).call(o,(function(e){_O(t,e,PO(n,e));}));}}return t}({},n,{t:d})}},{key:"getLineWidth",value:function(t,e){return !0===t?Math.max(this.selectionWidth,.3/this._body.view.scale):!0===e?Math.max(this.hoverWidth,.3/this._body.view.scale):Math.max(this.options.width,.3/this._body.view.scale)}},{key:"getColor",value:function(t,e){if(!1!==e.inheritsColor){if("both"===e.inheritsColor&&this.from.id!==this.to.id){var i=t.createLinearGradient(this.from.x,this.from.y,this.to.x,this.to.y),n=this.from.options.color.highlight.border,o=this.to.options.color.highlight.border;return !1===this.from.selected&&!1===this.to.selected?(n=ks(this.from.options.color.border,e.opacity),o=ks(this.to.options.color.border,e.opacity)):!0===this.from.selected&&!1===this.to.selected?o=this.to.options.color.border:!1===this.from.selected&&!0===this.to.selected&&(n=this.from.options.color.border),i.addColorStop(0,n),i.addColorStop(1,o),i}return "to"===e.inheritsColor?ks(this.to.options.color.border,e.opacity):ks(this.from.options.color.border,e.opacity)}return ks(e.color,e.opacity)}},{key:"_circle",value:function(t,e,i,n,o){this.enableShadow(t,e),t.beginPath(),t.arc(i,n,o,0,2*Math.PI,!1),t.stroke(),this.disableShadow(t,e);}},{key:"getDistanceToEdge",value:function(t,e,i,n,o,r){if(this.from!=this.to)return this._getDistanceToEdge(t,e,i,n,o,r);var s=this._getCircleData(void 0),a=US(s,3),h=a[0],l=a[1],d=a[2],u=h-o,c=l-r;return Math.abs(Math.sqrt(u*u+c*c)-d)}},{key:"_getDistanceToLine",value:function(t,e,i,n,o,r){var s=i-t,a=n-e,h=((o-t)*s+(r-e)*a)/(s*s+a*a);h>1?h=1:h<0&&(h=0);var l=t+h*s-o,d=e+h*a-r;return Math.sqrt(l*l+d*d)}},{key:"getArrowData",value:function(t,e,i,n,o,r){var s,a,h,l,d,u,c,f=r.width;"from"===e?(h=this.from,l=this.to,d=r.fromArrowScale<0,u=Math.abs(r.fromArrowScale),c=r.fromArrowType):"to"===e?(h=this.to,l=this.from,d=r.toArrowScale<0,u=Math.abs(r.toArrowScale),c=r.toArrowType):(h=this.to,l=this.from,d=r.middleArrowScale<0,u=Math.abs(r.middleArrowScale),c=r.middleArrowType);var p=15*u+3*f;if(h!=l){var v=p/bE(h.x-l.x,h.y-l.y);if("middle"!==e)if(!0===this.options.smooth.enabled){var y=this._findBorderPosition(h,t,{via:i}),g=this.getPoint(y.t+v*("from"===e?1:-1),i);s=Math.atan2(y.y-g.y,y.x-g.x),a=y;}else s=Math.atan2(h.y-l.y,h.x-l.x),a=this._findBorderPosition(h,t);else{var m=(d?-v:v)/2,b=this.getPoint(.5+m,i),w=this.getPoint(.5-m,i);s=Math.atan2(b.y-w.y,b.x-w.x),a=this.getPoint(.5,i);}}else{var _=this._getCircleData(t),k=US(_,3),x=k[0],O=k[1],S=k[2];if("from"===e){var M=this._findBorderPositionCircle(this.from,t,{x:x,y:O,low:.25,high:.6,direction:-1});s=-2*M.t*Math.PI+1.5*Math.PI+.1*Math.PI,a=M;}else if("to"===e){var E=this._findBorderPositionCircle(this.from,t,{x:x,y:O,low:.6,high:1,direction:1});s=-2*E.t*Math.PI+1.5*Math.PI-1.1*Math.PI,a=E;}else a=this._pointOnCircle(x,O,S,.175),s=3.9269908169872414;}return {point:a,core:{x:a.x-.9*p*Math.cos(s),y:a.y-.9*p*Math.sin(s)},angle:s,length:p,type:c}}},{key:"drawArrowHead",value:function(t,e,i,n,o){t.strokeStyle=this.getColor(t,e),t.fillStyle=t.strokeStyle,t.lineWidth=e.width,IE.draw(t,o)&&(this.enableShadow(t,e),AM(t).call(t),this.disableShadow(t,e));}},{key:"enableShadow",value:function(t,e){!0===e.shadow&&(t.shadowColor=e.shadowColor,t.shadowBlur=e.shadowSize,t.shadowOffsetX=e.shadowX,t.shadowOffsetY=e.shadowY);}},{key:"disableShadow",value:function(t,e){!0===e.shadow&&(t.shadowColor="rgba(0,0,0,0)",t.shadowBlur=0,t.shadowOffsetX=0,t.shadowOffsetY=0);}},{key:"drawBackground",value:function(t,e){if(!1!==e.background){var i={strokeStyle:t.strokeStyle,lineWidth:t.lineWidth,dashes:t.dashes};t.strokeStyle=e.backgroundColor,t.lineWidth=e.backgroundSize,this.setStrokeDashed(t,e.backgroundDashes),t.stroke(),t.strokeStyle=i.strokeStyle,t.lineWidth=i.lineWidth,t.dashes=i.dashes,this.setStrokeDashed(t,e.dashes);}}},{key:"setStrokeDashed",value:function(t,e){if(!1!==e)if(void 0!==t.setLineDash){var i=Yh(e)?e:[5,5];t.setLineDash(i);}else console.warn("setLineDash is not supported in this browser. The dashed stroke cannot be used.");else void 0!==t.setLineDash?t.setLineDash([]):console.warn("setLineDash is not supported in this browser. The dashed stroke cannot be used.");}}]),t}();function jE(t,e){var i=kS(t);if(wS){var n=wS(t);e&&(n=zO(n).call(n,(function(e){return PO(t,e).enumerable}))),i.push.apply(i,n);}return i}function zE(t){for(var e=1;e<arguments.length;e++){var i,n=null!=arguments[e]?arguments[e]:{};if(e%2)zh(i=jE(Object(n),!0)).call(i,(function(e){xS(t,e,n[e]);}));else if(EO)kO(t,EO(n));else{var o;zh(o=jE(Object(n))).call(o,(function(e){_O(t,e,PO(n,e));}));}}return t}var LE=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,NE),Mc(e,[{key:"_findBorderPositionBezier",value:function(t,e){var i,n,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this._getViaCoordinates(),r=10,s=.2,a=!1,h=1,l=0,d=this.to;t.id===this.from.id&&(d=this.from,a=!0);var u=0;do{n=.5*(l+h),i=this.getPoint(n,o);var c=Math.atan2(d.y-i.y,d.x-i.x),f=d.distanceToBorder(e,c),p=Math.sqrt(Math.pow(i.x-d.x,2)+Math.pow(i.y-d.y,2)),v=f-p;if(Math.abs(v)<s)break;v<0?!1===a?l=n:h=n:!1===a?h=n:l=n,++u;}while(l<=h&&u<r);return zE({},i,{t:n})}},{key:"_getDistanceToBezierEdge",value:function(t,e,i,n,o,r,s){var a,h,l,d,u,c=1e9,f=t,p=e;for(h=1;h<10;h++)l=.1*h,d=Math.pow(1-l,2)*t+2*l*(1-l)*s.x+Math.pow(l,2)*i,u=Math.pow(1-l,2)*e+2*l*(1-l)*s.y+Math.pow(l,2)*n,h>0&&(c=(a=this._getDistanceToLine(f,p,d,u,o,r))<c?a:c),f=d,p=u;return c}},{key:"_bezierCurve",value:function(t,e,i,n){t.beginPath(),t.moveTo(this.fromPoint.x,this.fromPoint.y),null!=i&&null!=i.x?null!=n&&null!=n.x?t.bezierCurveTo(i.x,i.y,n.x,n.y,this.toPoint.x,this.toPoint.y):t.quadraticCurveTo(i.x,i.y,this.toPoint.x,this.toPoint.y):t.lineTo(this.toPoint.x,this.toPoint.y),this.drawBackground(t,e),this.enableShadow(t,e),t.stroke(),this.disableShadow(t,e);}},{key:"getViaNode",value:function(){return this._getViaCoordinates()}}]),e}(),RE=function(t){function e(t,i,n){var o;return kc(this,e),(o=kM(this,MM(e).call(this,t,i,n))).via=o.via,o._boundFunction=function(){o.positionBezierNode();},o._body.emitter.on("_repositionBezierNodes",o._boundFunction),o}return TM(e,LE),Mc(e,[{key:"setOptions",value:function(t){pE(MM(e.prototype),"setOptions",this).call(this,t);var i=!1;this.options.physics!==t.physics&&(i=!0),this.options=t,this.id=this.options.id,this.from=this._body.nodes[this.options.from],this.to=this._body.nodes[this.options.to],this.setupSupportNode(),this.connect(),!0===i&&(this.via.setOptions({physics:this.options.physics}),this.positionBezierNode());}},{key:"connect",value:function(){this.from=this._body.nodes[this.options.from],this.to=this._body.nodes[this.options.to],void 0===this.from||void 0===this.to||!1===this.options.physics?this.via.setOptions({physics:!1}):this.from.id===this.to.id?this.via.setOptions({physics:!1}):this.via.setOptions({physics:!0});}},{key:"cleanup",value:function(){return this._body.emitter.off("_repositionBezierNodes",this._boundFunction),void 0!==this.via&&(delete this._body.nodes[this.via.id],this.via=void 0,!0)}},{key:"setupSupportNode",value:function(){if(void 0===this.via){var t="edgeId:"+this.id,e=this._body.functions.createNode({id:t,shape:"circle",physics:!0,hidden:!0});this._body.nodes[t]=e,this.via=e,this.via.parentEdgeId=this.id,this.positionBezierNode();}}},{key:"positionBezierNode",value:function(){void 0!==this.via&&void 0!==this.from&&void 0!==this.to?(this.via.x=.5*(this.from.x+this.to.x),this.via.y=.5*(this.from.y+this.to.y)):void 0!==this.via&&(this.via.x=0,this.via.y=0);}},{key:"_line",value:function(t,e,i){this._bezierCurve(t,e,i);}},{key:"_getViaCoordinates",value:function(){return this.via}},{key:"getViaNode",value:function(){return this.via}},{key:"getPoint",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.via;if(this.from===this.to){var i=this._getCircleData(),n=US(i,3),o=n[0],r=n[1],s=n[2],a=2*Math.PI*(1-t);return {x:o+s*Math.sin(a),y:r+s-s*(1-Math.cos(a))}}return {x:Math.pow(1-t,2)*this.fromPoint.x+2*t*(1-t)*e.x+Math.pow(t,2)*this.toPoint.x,y:Math.pow(1-t,2)*this.fromPoint.y+2*t*(1-t)*e.y+Math.pow(t,2)*this.toPoint.y}}},{key:"_findBorderPosition",value:function(t,e){return this._findBorderPositionBezier(t,e,this.via)}},{key:"_getDistanceToEdge",value:function(t,e,i,n,o,r){return this._getDistanceToBezierEdge(t,e,i,n,o,r,this.via)}}]),e}(),BE=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,LE),Mc(e,[{key:"_line",value:function(t,e,i){this._bezierCurve(t,e,i);}},{key:"getViaNode",value:function(){return this._getViaCoordinates()}},{key:"_getViaCoordinates",value:function(){var t,e,i=this.options.smooth.roundness,n=this.options.smooth.type,o=Math.abs(this.from.x-this.to.x),r=Math.abs(this.from.y-this.to.y);if("discrete"===n||"diagonalCross"===n){var s,a;s=a=o<=r?i*r:i*o,this.from.x>this.to.x&&(s=-s),this.from.y>=this.to.y&&(a=-a);var h=this.from.x+s,l=this.from.y+a;return "discrete"===n&&(o<=r?h=o<i*r?this.from.x:h:l=r<i*o?this.from.y:l),{x:h,y:l}}if("straightCross"===n){var d=(1-i)*o,u=(1-i)*r;return o<=r?(d=0,this.from.y<this.to.y&&(u=-u)):(this.from.x<this.to.x&&(d=-d),u=0),{x:this.to.x+d,y:this.to.y+u}}if("horizontal"===n){var c=(1-i)*o;return this.from.x<this.to.x&&(c=-c),{x:this.to.x+c,y:this.from.y}}if("vertical"===n){var f=(1-i)*r;return this.from.y<this.to.y&&(f=-f),{x:this.from.x,y:this.to.y+f}}if("curvedCW"===n){o=this.to.x-this.from.x,r=this.from.y-this.to.y;var p=Math.sqrt(o*o+r*r),v=Math.PI,y=(Math.atan2(r,o)+(.5*i+.5)*v)%(2*v);return {x:this.from.x+(.5*i+.5)*p*Math.sin(y),y:this.from.y+(.5*i+.5)*p*Math.cos(y)}}if("curvedCCW"===n){o=this.to.x-this.from.x,r=this.from.y-this.to.y;var g=Math.sqrt(o*o+r*r),m=Math.PI,b=(Math.atan2(r,o)+(.5*-i+.5)*m)%(2*m);return {x:this.from.x+(.5*i+.5)*g*Math.sin(b),y:this.from.y+(.5*i+.5)*g*Math.cos(b)}}t=e=o<=r?i*r:i*o,this.from.x>this.to.x&&(t=-t),this.from.y>=this.to.y&&(e=-e);var w=this.from.x+t,_=this.from.y+e;return o<=r?w=this.from.x<=this.to.x?this.to.x<w?this.to.x:w:this.to.x>w?this.to.x:w:_=this.from.y>=this.to.y?this.to.y>_?this.to.y:_:this.to.y<_?this.to.y:_,{x:w,y:_}}},{key:"_findBorderPosition",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return this._findBorderPositionBezier(t,e,i.via)}},{key:"_getDistanceToEdge",value:function(t,e,i,n,o,r){var s=arguments.length>6&&void 0!==arguments[6]?arguments[6]:this._getViaCoordinates();return this._getDistanceToBezierEdge(t,e,i,n,o,r,s)}},{key:"getPoint",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this._getViaCoordinates(),i=t,n=Math.pow(1-i,2)*this.fromPoint.x+2*i*(1-i)*e.x+Math.pow(i,2)*this.toPoint.x,o=Math.pow(1-i,2)*this.fromPoint.y+2*i*(1-i)*e.y+Math.pow(i,2)*this.toPoint.y;return {x:n,y:o}}}]),e}(),YE=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,LE),Mc(e,[{key:"_getDistanceToBezierEdge2",value:function(t,e,i,n,o,r,s,a){for(var h=1e9,l=t,d=e,u=[0,0,0,0],c=1;c<10;c++){var f=.1*c;u[0]=Math.pow(1-f,3),u[1]=3*f*Math.pow(1-f,2),u[2]=3*Math.pow(f,2)*(1-f),u[3]=Math.pow(f,3);var p=u[0]*t+u[1]*s.x+u[2]*a.x+u[3]*i,v=u[0]*e+u[1]*s.y+u[2]*a.y+u[3]*n;if(c>0){var y=this._getDistanceToLine(l,d,p,v,o,r);h=y<h?y:h;}l=p,d=v;}return h}}]),e}(),HE=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,YE),Mc(e,[{key:"_line",value:function(t,e,i){var n=i[0],o=i[1];this._bezierCurve(t,e,n,o);}},{key:"_getViaCoordinates",value:function(){var t,e,i,n,o=this.from.x-this.to.x,r=this.from.y-this.to.y,s=this.options.smooth.roundness;return (Math.abs(o)>Math.abs(r)||!0===this.options.smooth.forceDirection||"horizontal"===this.options.smooth.forceDirection)&&"vertical"!==this.options.smooth.forceDirection?(e=this.from.y,n=this.to.y,t=this.from.x-s*o,i=this.to.x+s*o):(e=this.from.y-s*r,n=this.to.y+s*r,t=this.from.x,i=this.to.x),[{x:t,y:e},{x:i,y:n}]}},{key:"getViaNode",value:function(){return this._getViaCoordinates()}},{key:"_findBorderPosition",value:function(t,e){return this._findBorderPositionBezier(t,e)}},{key:"_getDistanceToEdge",value:function(t,e,i,n,o,r){var s=arguments.length>6&&void 0!==arguments[6]?arguments[6]:this._getViaCoordinates(),a=US(s,2),h=a[0],l=a[1];return this._getDistanceToBezierEdge2(t,e,i,n,o,r,h,l)}},{key:"getPoint",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this._getViaCoordinates(),i=US(e,2),n=i[0],o=i[1],r=t,s=[Math.pow(1-r,3),3*r*Math.pow(1-r,2),3*Math.pow(r,2)*(1-r),Math.pow(r,3)],a=s[0]*this.fromPoint.x+s[1]*n.x+s[2]*o.x+s[3]*this.toPoint.x,h=s[0]*this.fromPoint.y+s[1]*n.y+s[2]*o.y+s[3]*this.toPoint.y;return {x:a,y:h}}}]),e}(),WE=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,NE),Mc(e,[{key:"_line",value:function(t,e){t.beginPath(),t.moveTo(this.fromPoint.x,this.fromPoint.y),t.lineTo(this.toPoint.x,this.toPoint.y),this.enableShadow(t,e),t.stroke(),this.disableShadow(t,e);}},{key:"getViaNode",value:function(){}},{key:"getPoint",value:function(t){return {x:(1-t)*this.fromPoint.x+t*this.toPoint.x,y:(1-t)*this.fromPoint.y+t*this.toPoint.y}}},{key:"_findBorderPosition",value:function(t,e){var i=this.to,n=this.from;t.id===this.from.id&&(i=this.from,n=this.to);var o=Math.atan2(i.y-n.y,i.x-n.x),r=i.x-n.x,s=i.y-n.y,a=Math.sqrt(r*r+s*s),h=(a-t.distanceToBorder(e,o))/a;return {x:(1-h)*n.x+h*i.x,y:(1-h)*n.y+h*i.y,t:0}}},{key:"_getDistanceToEdge",value:function(t,e,i,n,o,r){return this._getDistanceToLine(t,e,i,n,o,r)}}]),e}(),VE=function(){function t(e,i,n,o,r){if(kc(this,t),void 0===i)throw new Error("No body provided");this.options=js(o),this.globalOptions=o,this.defaultOptions=r,this.body=i,this.imagelist=n,this.id=void 0,this.fromId=void 0,this.toId=void 0,this.selected=!1,this.hover=!1,this.labelDirty=!0,this.baseWidth=this.options.width,this.baseFontSize=this.options.font.size,this.from=void 0,this.to=void 0,this.edgeType=void 0,this.connected=!1,this.labelModule=new wM(this.body,this.options,!0),this.setOptions(e);}return Mc(t,[{key:"setOptions",value:function(e){if(e){var i=void 0!==e.physics&&this.options.physics!==e.physics||void 0!==e.hidden&&(this.options.hidden||!1)!==(e.hidden||!1)||void 0!==e.from&&this.options.from!==e.from||void 0!==e.to&&this.options.to!==e.to;t.parseOptions(this.options,e,!0,this.globalOptions),void 0!==e.id&&(this.id=e.id),void 0!==e.from&&(this.fromId=e.from),void 0!==e.to&&(this.toId=e.to),void 0!==e.title&&(this.title=e.title),void 0!==e.value&&(e.value=IS(e.value));var n=[e,this.options,this.defaultOptions];return this.chooser=tM.choosify("edge",n),this.updateLabelModule(e),i=this.updateEdgeType()||i,this._setInteractionWidths(),this.connect(),i}}},{key:"getFormattingValues",value:function(){var t=!0===this.options.arrows.to||!0===this.options.arrows.to.enabled,e=!0===this.options.arrows.from||!0===this.options.arrows.from.enabled,i=!0===this.options.arrows.middle||!0===this.options.arrows.middle.enabled,n=this.options.color.inherit,o={toArrow:t,toArrowScale:this.options.arrows.to.scaleFactor,toArrowType:this.options.arrows.to.type,toArrowSrc:this.options.arrows.to.src,toArrowImageWidth:this.options.arrows.to.imageWidth,toArrowImageHeight:this.options.arrows.to.imageHeight,middleArrow:i,middleArrowScale:this.options.arrows.middle.scaleFactor,middleArrowType:this.options.arrows.middle.type,middleArrowSrc:this.options.arrows.middle.src,middleArrowImageWidth:this.options.arrows.middle.imageWidth,middleArrowImageHeight:this.options.arrows.middle.imageHeight,fromArrow:e,fromArrowScale:this.options.arrows.from.scaleFactor,fromArrowType:this.options.arrows.from.type,fromArrowSrc:this.options.arrows.from.src,fromArrowImageWidth:this.options.arrows.from.imageWidth,fromArrowImageHeight:this.options.arrows.from.imageHeight,arrowStrikethrough:this.options.arrowStrikethrough,color:n?void 0:this.options.color.color,inheritsColor:n,opacity:this.options.color.opacity,hidden:this.options.hidden,length:this.options.length,shadow:this.options.shadow.enabled,shadowColor:this.options.shadow.color,shadowSize:this.options.shadow.size,shadowX:this.options.shadow.x,shadowY:this.options.shadow.y,dashes:this.options.dashes,width:this.options.width,background:this.options.background.enabled,backgroundColor:this.options.background.color,backgroundSize:this.options.background.size,backgroundDashes:this.options.background.dashes};if(this.selected||this.hover)if(!0===this.chooser){if(this.selected){var r=this.options.selectionWidth;"function"==typeof r?o.width=r(o.width):"number"==typeof r&&(o.width+=r),o.width=Math.max(o.width,.3/this.body.view.scale),o.color=this.options.color.highlight,o.shadow=this.options.shadow.enabled;}else if(this.hover){var s=this.options.hoverWidth;"function"==typeof s?o.width=s(o.width):"number"==typeof s&&(o.width+=s),o.width=Math.max(o.width,.3/this.body.view.scale),o.color=this.options.color.hover,o.shadow=this.options.shadow.enabled;}}else"function"==typeof this.chooser&&(this.chooser(o,this.options.id,this.selected,this.hover),void 0!==o.color&&(o.inheritsColor=!1),!1===o.shadow&&(o.shadowColor===this.options.shadow.color&&o.shadowSize===this.options.shadow.size&&o.shadowX===this.options.shadow.x&&o.shadowY===this.options.shadow.y||(o.shadow=!0)));else o.shadow=this.options.shadow.enabled,o.width=Math.max(o.width,.3/this.body.view.scale);return o}},{key:"updateLabelModule",value:function(t){var e=[t,this.options,this.globalOptions,this.defaultOptions];this.labelModule.update(this.options,e),void 0!==this.labelModule.baseSize&&(this.baseFontSize=this.labelModule.baseSize);}},{key:"updateEdgeType",value:function(){var t=this.options.smooth,e=!1,i=!0;return void 0!==this.edgeType&&((this.edgeType instanceof RE&&!0===t.enabled&&"dynamic"===t.type||this.edgeType instanceof HE&&!0===t.enabled&&"cubicBezier"===t.type||this.edgeType instanceof BE&&!0===t.enabled&&"dynamic"!==t.type&&"cubicBezier"!==t.type||this.edgeType instanceof WE&&!1===t.type.enabled)&&(i=!1),!0===i&&(e=this.cleanup())),!0===i?!0===t.enabled?"dynamic"===t.type?(e=!0,this.edgeType=new RE(this.options,this.body,this.labelModule)):"cubicBezier"===t.type?this.edgeType=new HE(this.options,this.body,this.labelModule):this.edgeType=new BE(this.options,this.body,this.labelModule):this.edgeType=new WE(this.options,this.body,this.labelModule):this.edgeType.setOptions(this.options),e}},{key:"connect",value:function(){this.disconnect(),this.from=this.body.nodes[this.fromId]||void 0,this.to=this.body.nodes[this.toId]||void 0,this.connected=void 0!==this.from&&void 0!==this.to,!0===this.connected?(this.from.attachEdge(this),this.to.attachEdge(this)):(this.from&&this.from.detachEdge(this),this.to&&this.to.detachEdge(this)),this.edgeType.connect();}},{key:"disconnect",value:function(){this.from&&(this.from.detachEdge(this),this.from=void 0),this.to&&(this.to.detachEdge(this),this.to=void 0),this.connected=!1;}},{key:"getTitle",value:function(){return this.title}},{key:"isSelected",value:function(){return this.selected}},{key:"getValue",value:function(){return this.options.value}},{key:"setValueRange",value:function(t,e,i){if(void 0!==this.options.value){var n=this.options.scaling.customScalingFunction(t,e,i,this.options.value),o=this.options.scaling.max-this.options.scaling.min;if(!0===this.options.scaling.label.enabled){var r=this.options.scaling.label.max-this.options.scaling.label.min;this.options.font.size=this.options.scaling.label.min+n*r;}this.options.width=this.options.scaling.min+n*o;}else this.options.width=this.baseWidth,this.options.font.size=this.baseFontSize;this._setInteractionWidths(),this.updateLabelModule();}},{key:"_setInteractionWidths",value:function(){"function"==typeof this.options.hoverWidth?this.edgeType.hoverWidth=this.options.hoverWidth(this.options.width):this.edgeType.hoverWidth=this.options.hoverWidth+this.options.width,"function"==typeof this.options.selectionWidth?this.edgeType.selectionWidth=this.options.selectionWidth(this.options.width):this.edgeType.selectionWidth=this.options.selectionWidth+this.options.width;}},{key:"draw",value:function(t){var e=this.getFormattingValues();if(!e.hidden){var i=this.edgeType.getViaNode(),n={};this.edgeType.fromPoint=this.edgeType.from,this.edgeType.toPoint=this.edgeType.to,e.fromArrow&&(n.from=this.edgeType.getArrowData(t,"from",i,this.selected,this.hover,e),!1===e.arrowStrikethrough&&(this.edgeType.fromPoint=n.from.core),e.fromArrowSrc&&(n.from.image=this.imagelist.load(e.fromArrowSrc)),e.fromArrowImageWidth&&(n.from.imageWidth=e.fromArrowImageWidth),e.fromArrowImageHeight&&(n.from.imageHeight=e.fromArrowImageHeight)),e.toArrow&&(n.to=this.edgeType.getArrowData(t,"to",i,this.selected,this.hover,e),!1===e.arrowStrikethrough&&(this.edgeType.toPoint=n.to.core),e.toArrowSrc&&(n.to.image=this.imagelist.load(e.toArrowSrc)),e.toArrowImageWidth&&(n.to.imageWidth=e.toArrowImageWidth),e.toArrowImageHeight&&(n.to.imageHeight=e.toArrowImageHeight)),e.middleArrow&&(n.middle=this.edgeType.getArrowData(t,"middle",i,this.selected,this.hover,e),e.middleArrowSrc&&(n.middle.image=this.imagelist.load(e.middleArrowSrc)),e.middleArrowImageWidth&&(n.middle.imageWidth=e.middleArrowImageWidth),e.middleArrowImageHeight&&(n.middle.imageHeight=e.middleArrowImageHeight)),this.edgeType.drawLine(t,e,this.selected,this.hover,i),this.drawArrows(t,n,e),this.drawLabel(t,i);}}},{key:"drawArrows",value:function(t,e,i){i.fromArrow&&this.edgeType.drawArrowHead(t,i,this.selected,this.hover,e.from),i.middleArrow&&this.edgeType.drawArrowHead(t,i,this.selected,this.hover,e.middle),i.toArrow&&this.edgeType.drawArrowHead(t,i,this.selected,this.hover,e.to);}},{key:"drawLabel",value:function(t,e){if(void 0!==this.options.label){var i=this.from,n=this.to;if(this.labelModule.differentState(this.selected,this.hover)&&this.labelModule.getTextSize(t,this.selected,this.hover),i.id!=n.id){this.labelModule.pointToSelf=!1;var o=this.edgeType.getPoint(.5,e);t.save();var r=this._getRotation(t);0!=r.angle&&(t.translate(r.x,r.y),t.rotate(r.angle)),this.labelModule.draw(t,o.x,o.y,this.selected,this.hover),t.restore();}else{var s,a;this.labelModule.pointToSelf=!0;var h=this.options.selfReferenceSize;i.shape.width>i.shape.height?(s=i.x+.5*i.shape.width,a=i.y-h):(s=i.x+h,a=i.y-.5*i.shape.height),o=this._pointOnCircle(s,a,h,.125),this.labelModule.draw(t,o.x,o.y,this.selected,this.hover);}}}},{key:"getItemsOnPoint",value:function(t){var e=[];if(this.labelModule.visible()){var i=this._getRotation();tM.pointInRect(this.labelModule.getSize(),t,i)&&e.push({edgeId:this.id,labelId:0});}var n={left:t.x,top:t.y};return this.isOverlappingWith(n)&&e.push({edgeId:this.id}),e}},{key:"isOverlappingWith",value:function(t){if(this.connected){var e=this.from.x,i=this.from.y,n=this.to.x,o=this.to.y,r=t.left,s=t.top;return this.edgeType.getDistanceToEdge(e,i,n,o,r,s)<10}return !1}},{key:"_getRotation",value:function(t){var e=this.edgeType.getViaNode(),i=this.edgeType.getPoint(.5,e);void 0!==t&&this.labelModule.calculateLabelSize(t,this.selected,this.hover,i.x,i.y);var n={x:i.x,y:this.labelModule.size.yLine,angle:0};if(!this.labelModule.visible())return n;if("horizontal"===this.options.font.align)return n;var o=this.from.y-this.to.y,r=this.from.x-this.to.x,s=Math.atan2(o,r);return (s<-1&&r<0||s>0&&r<0)&&(s+=Math.PI),n.angle=s,n}},{key:"_pointOnCircle",value:function(t,e,i,n){var o=2*n*Math.PI;return {x:t+i*Math.cos(o),y:e-i*Math.sin(o)}}},{key:"select",value:function(){this.selected=!0;}},{key:"unselect",value:function(){this.selected=!1;}},{key:"cleanup",value:function(){return this.edgeType.cleanup()}},{key:"remove",value:function(){this.cleanup(),this.disconnect(),delete this.body.edges[this.id];}},{key:"endPointsValid",value:function(){return void 0!==this.body.nodes[this.fromId]&&void 0!==this.body.nodes[this.toId]}}],[{key:"parseOptions",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{},o=arguments.length>4&&void 0!==arguments[4]&&arguments[4],r=["arrowStrikethrough","id","from","hidden","hoverWidth","labelHighlightBold","length","line","opacity","physics","scaling","selectionWidth","selfReferenceSize","to","title","value","width","font","chosen","widthConstraint"];if(Qr(r,t,e,i),tM.isValidLabel(e.label)?t.label=e.label:tM.isValidLabel(t.label)||(t.label=void 0),Ls(t,e,"smooth",n),Ls(t,e,"shadow",n),Ls(t,e,"background",n),void 0!==e.dashes&&null!==e.dashes?t.dashes=e.dashes:!0===i&&null===e.dashes&&(t.dashes=bl(n.dashes)),void 0!==e.scaling&&null!==e.scaling?(void 0!==e.scaling.min&&(t.scaling.min=e.scaling.min),void 0!==e.scaling.max&&(t.scaling.max=e.scaling.max),Ls(t.scaling,e.scaling,"label",n.scaling)):!0===i&&null===e.scaling&&(t.scaling=bl(n.scaling)),void 0!==e.arrows&&null!==e.arrows)if("string"==typeof e.arrows){var s=e.arrows.toLowerCase();t.arrows.to.enabled=-1!=yl(s).call(s,"to"),t.arrows.middle.enabled=-1!=yl(s).call(s,"middle"),t.arrows.from.enabled=-1!=yl(s).call(s,"from");}else{if("object"!==QS(e.arrows))throw new Error("The arrow newOptions can only be an object or a string. Refer to the documentation. You used:"+oE(e.arrows));Ls(t.arrows,e.arrows,"to",n.arrows),Ls(t.arrows,e.arrows,"middle",n.arrows),Ls(t.arrows,e.arrows,"from",n.arrows);}else!0===i&&null===e.arrows&&(t.arrows=bl(n.arrows));if(void 0!==e.color&&null!==e.color){var a=Gr(e.color)?{color:e.color,highlight:e.color,hover:e.color,inherit:!1,opacity:1}:e.color,h=t.color;if(o)es(h,n.color,!1,i);else for(var l in h)h.hasOwnProperty(l)&&delete h[l];if(Gr(h))h.color=h,h.highlight=h,h.hover=h,h.inherit=!1,void 0===a.opacity&&(h.opacity=1);else{var d=!1;void 0!==a.color&&(h.color=a.color,d=!0),void 0!==a.highlight&&(h.highlight=a.highlight,d=!0),void 0!==a.hover&&(h.hover=a.hover,d=!0),void 0!==a.inherit&&(h.inherit=a.inherit),void 0!==a.opacity&&(h.opacity=Math.min(1,Math.max(0,a.opacity))),!0===d?h.inherit=!1:void 0===h.inherit&&(h.inherit="from");}}else!0===i&&null===e.color&&(t.color=js(n.color));!0===i&&null===e.font&&(t.font=js(n.font));}}]),t}(),UE=function(){function t(e,i,n){var o,r=this;kc(this,t),this.body=e,this.images=i,this.groups=n,this.body.functions.createEdge=$(o=this.create).call(o,this),this.edgesListeners={add:function(t,e){r.add(e.items);},update:function(t,e){r.update(e.items);},remove:function(t,e){r.remove(e.items);}},this.options={},this.defaultOptions={arrows:{to:{enabled:!1,scaleFactor:1,type:"arrow"},middle:{enabled:!1,scaleFactor:1,type:"arrow"},from:{enabled:!1,scaleFactor:1,type:"arrow"}},arrowStrikethrough:!0,color:{color:"#848484",highlight:"#848484",hover:"#848484",inherit:"from",opacity:1},dashes:!1,font:{color:"#343434",size:14,face:"arial",background:"none",strokeWidth:2,strokeColor:"#ffffff",align:"horizontal",multi:!1,vadjust:0,bold:{mod:"bold"},boldital:{mod:"bold italic"},ital:{mod:"italic"},mono:{mod:"",size:15,face:"courier new",vadjust:2}},hidden:!1,hoverWidth:1.5,label:void 0,labelHighlightBold:!0,length:void 0,physics:!0,scaling:{min:1,max:15,label:{enabled:!0,min:14,max:30,maxVisible:30,drawThreshold:5},customScalingFunction:function(t,e,i,n){if(e===t)return .5;var o=1/(e-t);return Math.max(0,(n-t)*o)}},selectionWidth:1.5,selfReferenceSize:20,shadow:{enabled:!1,color:"rgba(0,0,0,0.5)",size:10,x:5,y:5},background:{enabled:!1,color:"rgba(111,111,111,1)",size:10,dashes:!1},smooth:{enabled:!0,type:"dynamic",forceDirection:"none",roundness:.5},title:void 0,width:1,value:void 0},es(this.options,this.defaultOptions),this.bindEventListeners();}return Mc(t,[{key:"bindEventListeners",value:function(){var t,e,i=this;this.body.emitter.on("_forceDisableDynamicCurves",(function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];"dynamic"===t&&(t="continuous");var n=!1;for(var o in i.body.edges)if(i.body.edges.hasOwnProperty(o)){var r=i.body.edges[o],s=i.body.data.edges.get(o);if(null!=s){var a=s.smooth;void 0!==a&&!0===a.enabled&&"dynamic"===a.type&&(void 0===t?r.setOptions({smooth:!1}):r.setOptions({smooth:{type:t}}),n=!0);}}!0===e&&!0===n&&i.body.emitter.emit("_dataChanged");})),this.body.emitter.on("_dataUpdated",(function(){i.reconnectEdges();})),this.body.emitter.on("refreshEdges",$(t=this.refresh).call(t,this)),this.body.emitter.on("refresh",$(e=this.refresh).call(e,this)),this.body.emitter.on("destroy",(function(){us(i.edgesListeners,(function(t,e){i.body.data.edges&&i.body.data.edges.off(e,t);})),delete i.body.functions.createEdge,delete i.edgesListeners.add,delete i.edgesListeners.update,delete i.edgesListeners.remove,delete i.edgesListeners;}));}},{key:"setOptions",value:function(t){if(void 0!==t){VE.parseOptions(this.options,t,!0,this.defaultOptions,!0);var e=!1;if(void 0!==t.smooth)for(var i in this.body.edges)this.body.edges.hasOwnProperty(i)&&(e=this.body.edges[i].updateEdgeType()||e);if(void 0!==t.font)for(var n in this.body.edges)this.body.edges.hasOwnProperty(n)&&this.body.edges[n].updateLabelModule();void 0===t.hidden&&void 0===t.physics&&!0!==e||this.body.emitter.emit("_dataChanged");}}},{key:"setData",value:function(t){var e=this,i=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=this.body.data.edges;if(t instanceof gO||t instanceof mO)this.body.data.edges=t;else if(Yh(t))this.body.data.edges=new gO,this.body.data.edges.add(t);else{if(t)throw new TypeError("Array or DataSet expected");this.body.data.edges=new gO;}if(n&&us(this.edgesListeners,(function(t,e){n.off(e,t);})),this.body.edges={},this.body.data.edges){us(this.edgesListeners,(function(t,i){e.body.data.edges.on(i,t);}));var o=this.body.data.edges.getIds();this.add(o,!0);}this.body.emitter.emit("_adjustEdgesForHierarchicalLayout"),!1===i&&this.body.emitter.emit("_dataChanged");}},{key:"add",value:function(t){for(var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=this.body.edges,n=this.body.data.edges,o=0;o<t.length;o++){var r=t[o],s=i[r];s&&s.disconnect();var a=n.get(r,{showInternalIds:!0});i[r]=this.create(a);}this.body.emitter.emit("_adjustEdgesForHierarchicalLayout"),!1===e&&this.body.emitter.emit("_dataChanged");}},{key:"update",value:function(t){for(var e=this.body.edges,i=this.body.data.edges,n=!1,o=0;o<t.length;o++){var r=t[o],s=i.get(r),a=e[r];void 0!==a?(a.disconnect(),n=a.setOptions(s)||n,a.connect()):(this.body.edges[r]=this.create(s),n=!0);}!0===n?(this.body.emitter.emit("_adjustEdgesForHierarchicalLayout"),this.body.emitter.emit("_dataChanged")):this.body.emitter.emit("_dataUpdated");}},{key:"remove",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if(0!==t.length){var i=this.body.edges;us(t,(function(t){var e=i[t];void 0!==e&&e.remove();})),e&&this.body.emitter.emit("_dataChanged");}}},{key:"refresh",value:function(){var t=this;us(this.body.edges,(function(e,i){var n=t.body.data.edges.get(i);void 0!==n&&e.setOptions(n);}));}},{key:"create",value:function(t){return new VE(t,this.body,this.images,this.options,this.defaultOptions)}},{key:"reconnectEdges",value:function(){var t,e=this.body.nodes,i=this.body.edges;for(t in e)e.hasOwnProperty(t)&&(e[t].edges=[]);for(t in i)if(i.hasOwnProperty(t)){var n=i[t];n.from=null,n.to=null,n.connect();}}},{key:"getConnectedNodes",value:function(t){var e=[];if(void 0!==this.body.edges[t]){var i=this.body.edges[t];void 0!==i.fromId&&e.push(i.fromId),void 0!==i.toId&&e.push(i.toId);}return e}},{key:"_updateState",value:function(){this._addMissingEdges(),this._removeInvalidEdges();}},{key:"_removeInvalidEdges",value:function(){var t=this,e=[];us(this.body.edges,(function(i,n){var o=t.body.nodes[i.toId],r=t.body.nodes[i.fromId];void 0!==o&&!0===o.isCluster||void 0!==r&&!0===r.isCluster||void 0!==o&&void 0!==r||e.push(n);})),this.remove(e,!1);}},{key:"_addMissingEdges",value:function(){var t=this.body.data.edges;if(null!=t){var e=this.body.edges,i=[];zh(t).call(t,(function(t,n){void 0===e[n]&&i.push(n);})),this.add(i,!0);}}}]),t}();W({target:"Date",stat:!0},{now:function(){return (new Date).getTime()}});var GE=F.Date.now,qE=function(){function t(e,i,n){kc(this,t),this.body=e,this.physicsBody=i,this.barnesHutTree,this.setOptions(n),this.randomSeed=5;}return Mc(t,[{key:"setOptions",value:function(t){this.options=t,this.thetaInversed=1/this.options.theta,this.overlapAvoidanceFactor=1-Math.max(0,Math.min(1,this.options.avoidOverlap));}},{key:"seededRandom",value:function(){var t=1e4*Math.sin(this.randomSeed++);return t-Math.floor(t)}},{key:"solve",value:function(){if(0!==this.options.gravitationalConstant&&this.physicsBody.physicsNodeIndices.length>0){var t,e=this.body.nodes,i=this.physicsBody.physicsNodeIndices,n=i.length,o=this._formBarnesHutTree(e,i);this.barnesHutTree=o;for(var r=0;r<n;r++)(t=e[i[r]]).options.mass>0&&this._getForceContributions(o.root,t);}}},{key:"_getForceContributions",value:function(t,e){this._getForceContribution(t.children.NW,e),this._getForceContribution(t.children.NE,e),this._getForceContribution(t.children.SW,e),this._getForceContribution(t.children.SE,e);}},{key:"_getForceContribution",value:function(t,e){var i,n,o;t.childrenCount>0&&(i=t.centerOfMass.x-e.x,n=t.centerOfMass.y-e.y,(o=Math.sqrt(i*i+n*n))*t.calcSize>this.thetaInversed?this._calculateForces(o,i,n,e,t):4===t.childrenCount?this._getForceContributions(t,e):t.children.data.id!=e.id&&this._calculateForces(o,i,n,e,t));}},{key:"_calculateForces",value:function(t,e,i,n,o){0===t&&(e=t=.1),this.overlapAvoidanceFactor<1&&n.shape.radius&&(t=Math.max(.1+this.overlapAvoidanceFactor*n.shape.radius,t-n.shape.radius));var r=this.options.gravitationalConstant*o.mass*n.options.mass/Math.pow(t,3),s=e*r,a=i*r;this.physicsBody.forces[n.id].x+=s,this.physicsBody.forces[n.id].y+=a;}},{key:"_formBarnesHutTree",value:function(t,e){for(var i,n=e.length,o=t[e[0]].x,r=t[e[0]].y,s=t[e[0]].x,a=t[e[0]].y,h=1;h<n;h++){var l=t[e[h]],d=l.x,u=l.y;l.options.mass>0&&(d<o&&(o=d),d>s&&(s=d),u<r&&(r=u),u>a&&(a=u));}var c=Math.abs(s-o)-Math.abs(a-r);c>0?(r-=.5*c,a+=.5*c):(o+=.5*c,s-=.5*c);var f=Math.max(1e-5,Math.abs(s-o)),p=.5*f,v=.5*(o+s),y=.5*(r+a),g={root:{centerOfMass:{x:0,y:0},mass:0,range:{minX:v-p,maxX:v+p,minY:y-p,maxY:y+p},size:f,calcSize:1/f,children:{data:null},maxWidth:0,level:0,childrenCount:4}};this._splitBranch(g.root);for(var m=0;m<n;m++)(i=t[e[m]]).options.mass>0&&this._placeInTree(g.root,i);return g}},{key:"_updateBranchMass",value:function(t,e){var i=t.centerOfMass,n=t.mass+e.options.mass,o=1/n;i.x=i.x*t.mass+e.x*e.options.mass,i.x*=o,i.y=i.y*t.mass+e.y*e.options.mass,i.y*=o,t.mass=n;var r=Math.max(Math.max(e.height,e.radius),e.width);t.maxWidth=t.maxWidth<r?r:t.maxWidth;}},{key:"_placeInTree",value:function(t,e,i){1==i&&void 0!==i||this._updateBranchMass(t,e);var n,o=t.children.NW.range;n=o.maxX>e.x?o.maxY>e.y?"NW":"SW":o.maxY>e.y?"NE":"SE",this._placeInRegion(t,e,n);}},{key:"_placeInRegion",value:function(t,e,i){var n=t.children[i];switch(n.childrenCount){case 0:n.children.data=e,n.childrenCount=1,this._updateBranchMass(n,e);break;case 1:n.children.data.x===e.x&&n.children.data.y===e.y?(e.x+=this.seededRandom(),e.y+=this.seededRandom()):(this._splitBranch(n),this._placeInTree(n,e));break;case 4:this._placeInTree(n,e);}}},{key:"_splitBranch",value:function(t){var e=null;1===t.childrenCount&&(e=t.children.data,t.mass=0,t.centerOfMass.x=0,t.centerOfMass.y=0),t.childrenCount=4,t.children.data=null,this._insertRegion(t,"NW"),this._insertRegion(t,"NE"),this._insertRegion(t,"SW"),this._insertRegion(t,"SE"),null!=e&&this._placeInTree(t,e);}},{key:"_insertRegion",value:function(t,e){var i,n,o,r,s=.5*t.size;switch(e){case"NW":i=t.range.minX,n=t.range.minX+s,o=t.range.minY,r=t.range.minY+s;break;case"NE":i=t.range.minX+s,n=t.range.maxX,o=t.range.minY,r=t.range.minY+s;break;case"SW":i=t.range.minX,n=t.range.minX+s,o=t.range.minY+s,r=t.range.maxY;break;case"SE":i=t.range.minX+s,n=t.range.maxX,o=t.range.minY+s,r=t.range.maxY;}t.children[e]={centerOfMass:{x:0,y:0},mass:0,range:{minX:i,maxX:n,minY:o,maxY:r},size:.5*t.size,calcSize:2*t.calcSize,children:{data:null},maxWidth:0,level:t.level+1,childrenCount:0};}},{key:"_debug",value:function(t,e){void 0!==this.barnesHutTree&&(t.lineWidth=1,this._drawBranch(this.barnesHutTree.root,t,e));}},{key:"_drawBranch",value:function(t,e,i){void 0===i&&(i="#FF0000"),4===t.childrenCount&&(this._drawBranch(t.children.NW,e),this._drawBranch(t.children.NE,e),this._drawBranch(t.children.SE,e),this._drawBranch(t.children.SW,e)),e.strokeStyle=i,e.beginPath(),e.moveTo(t.range.minX,t.range.minY),e.lineTo(t.range.maxX,t.range.minY),e.stroke(),e.beginPath(),e.moveTo(t.range.maxX,t.range.minY),e.lineTo(t.range.maxX,t.range.maxY),e.stroke(),e.beginPath(),e.moveTo(t.range.maxX,t.range.maxY),e.lineTo(t.range.minX,t.range.maxY),e.stroke(),e.beginPath(),e.moveTo(t.range.minX,t.range.maxY),e.lineTo(t.range.minX,t.range.minY),e.stroke();}}]),t}(),XE=function(){function t(e,i,n){kc(this,t),this.body=e,this.physicsBody=i,this.setOptions(n);}return Mc(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"solve",value:function(){for(var t,e,i,n,o,r,s,a,h=this.body.nodes,l=this.physicsBody.physicsNodeIndices,d=this.physicsBody.forces,u=this.options.nodeDistance,c=-2/3/u,f=0;f<l.length-1;f++){s=h[l[f]];for(var p=f+1;p<l.length;p++)t=(a=h[l[p]]).x-s.x,e=a.y-s.y,0===(i=Math.sqrt(t*t+e*e))&&(t=i=.1*Math.random()),i<2*u&&(r=i<.5*u?1:c*i+4/3,n=t*(r/=i),o=e*r,d[s.id].x-=n,d[s.id].y-=o,d[a.id].x+=n,d[a.id].y+=o);}}}]),t}();var ZE=function(t){throw new Error('"'+t+'" is read-only')},KE=function(){function t(e,i,n){kc(this,t),this.body=e,this.physicsBody=i,this.setOptions(n);}return Mc(t,[{key:"setOptions",value:function(t){this.options=t,this.overlapAvoidanceFactor=Math.max(0,Math.min(1,this.options.avoidOverlap||0));}},{key:"solve",value:function(){for(var t=this.body.nodes,e=this.physicsBody.physicsNodeIndices,i=this.physicsBody.forces,n=this.options.nodeDistance,o=0;o<e.length-1;o++)for(var r=t[e[o]],s=o+1;s<e.length;s++){var a=t[e[s]];if(r.level===a.level){var h=n+this.overlapAvoidanceFactor*((r.shape.radius||0)/2+(a.shape.radius||0)/2),l=a.x-r.x,d=a.y-r.y,u=Math.sqrt(l*l+d*d),c=void 0;c=u<h?-Math.pow(.05*u,2)+Math.pow(.05*h,2):0,0===u?(ZE("distance"),u=.01):c/=u;var f=l*c,p=d*c;i[r.id].x-=f,i[r.id].y-=p,i[a.id].x+=f,i[a.id].y+=p;}}}}]),t}(),$E=function(){function t(e,i,n){kc(this,t),this.body=e,this.physicsBody=i,this.setOptions(n);}return Mc(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"solve",value:function(){for(var t,e,i,n,o,r=this.physicsBody.physicsEdgeIndices,s=this.body.edges,a=0;a<r.length;a++)!0===(e=s[r[a]]).connected&&e.toId!==e.fromId&&void 0!==this.body.nodes[e.toId]&&void 0!==this.body.nodes[e.fromId]&&(void 0!==e.edgeType.via?(t=void 0===e.options.length?this.options.springLength:e.options.length,i=e.to,n=e.edgeType.via,o=e.from,this._calculateSpringForce(i,n,.5*t),this._calculateSpringForce(n,o,.5*t)):(t=void 0===e.options.length?1.5*this.options.springLength:e.options.length,this._calculateSpringForce(e.from,e.to,t)));}},{key:"_calculateSpringForce",value:function(t,e,i){var n=t.x-e.x,o=t.y-e.y,r=Math.max(Math.sqrt(n*n+o*o),.01),s=this.options.springConstant*(i-r)/r,a=n*s,h=o*s;void 0!==this.physicsBody.forces[t.id]&&(this.physicsBody.forces[t.id].x+=a,this.physicsBody.forces[t.id].y+=h),void 0!==this.physicsBody.forces[e.id]&&(this.physicsBody.forces[e.id].x-=a,this.physicsBody.forces[e.id].y-=h);}}]),t}(),JE=function(){function t(e,i,n){kc(this,t),this.body=e,this.physicsBody=i,this.setOptions(n);}return Mc(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"solve",value:function(){for(var t,e,i,n,o,r,s,a,h,l,d=this.body.edges,u=this.physicsBody.physicsEdgeIndices,c=this.physicsBody.physicsNodeIndices,f=this.physicsBody.forces,p=0;p<c.length;p++){var v=c[p];f[v].springFx=0,f[v].springFy=0;}for(var y=0;y<u.length;y++)!0===(e=d[u[y]]).connected&&(t=void 0===e.options.length?this.options.springLength:e.options.length,i=e.from.x-e.to.x,n=e.from.y-e.to.y,a=0===(a=Math.sqrt(i*i+n*n))?.01:a,o=i*(s=this.options.springConstant*(t-a)/a),r=n*s,e.to.level!=e.from.level?(void 0!==f[e.toId]&&(f[e.toId].springFx-=o,f[e.toId].springFy-=r),void 0!==f[e.fromId]&&(f[e.fromId].springFx+=o,f[e.fromId].springFy+=r)):(void 0!==f[e.toId]&&(f[e.toId].x-=.5*o,f[e.toId].y-=.5*r),void 0!==f[e.fromId]&&(f[e.fromId].x+=.5*o,f[e.fromId].y+=.5*r)));s=1;for(var g=0;g<c.length;g++){var m=c[g];h=Math.min(s,Math.max(-s,f[m].springFx)),l=Math.min(s,Math.max(-s,f[m].springFy)),f[m].x+=h,f[m].y+=l;}for(var b=0,w=0,_=0;_<c.length;_++){var k=c[_];b+=f[k].x,w+=f[k].y;}for(var x=b/c.length,O=w/c.length,S=0;S<c.length;S++){var M=c[S];f[M].x-=x,f[M].y-=O;}}}]),t}(),QE=function(){function t(e,i,n){kc(this,t),this.body=e,this.physicsBody=i,this.setOptions(n);}return Mc(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"solve",value:function(){for(var t,e,i,n,o=this.body.nodes,r=this.physicsBody.physicsNodeIndices,s=this.physicsBody.forces,a=0;a<r.length;a++){t=-(n=o[r[a]]).x,e=-n.y,i=Math.sqrt(t*t+e*e),this._calculateForces(i,t,e,s,n);}}},{key:"_calculateForces",value:function(t,e,i,n,o){var r=0===t?0:this.options.centralGravity/t;n[o.id].x=e*r,n[o.id].y=i*r;}}]),t}(),tD=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,qE),Mc(e,[{key:"_calculateForces",value:function(t,e,i,n,o){0===t&&(e=t=.1*Math.random()),this.overlapAvoidanceFactor<1&&n.shape.radius&&(t=Math.max(.1+this.overlapAvoidanceFactor*n.shape.radius,t-n.shape.radius));var r=n.edges.length+1,s=this.options.gravitationalConstant*o.mass*n.options.mass*r/Math.pow(t,2),a=e*s,h=i*s;this.physicsBody.forces[n.id].x+=a,this.physicsBody.forces[n.id].y+=h;}}]),e}(),eD=function(t){function e(t,i,n){return kc(this,e),kM(this,MM(e).call(this,t,i,n))}return TM(e,QE),Mc(e,[{key:"_calculateForces",value:function(t,e,i,n,o){if(t>0){var r=o.edges.length+1,s=this.options.centralGravity*r*o.options.mass;n[o.id].x=e*s,n[o.id].y=i*s;}}}]),e}(),iD=function(){function t(e){kc(this,t),this.body=e,this.physicsBody={physicsNodeIndices:[],physicsEdgeIndices:[],forces:{},velocities:{}},this.physicsEnabled=!0,this.simulationInterval=1e3/60,this.requiresTimeout=!0,this.previousStates={},this.referenceState={},this.freezeCache={},this.renderTimer=void 0,this.adaptiveTimestep=!1,this.adaptiveTimestepEnabled=!1,this.adaptiveCounter=0,this.adaptiveInterval=3,this.stabilized=!1,this.startedStabilization=!1,this.stabilizationIterations=0,this.ready=!1,this.options={},this.defaultOptions={enabled:!0,barnesHut:{theta:.5,gravitationalConstant:-2e3,centralGravity:.3,springLength:95,springConstant:.04,damping:.09,avoidOverlap:0},forceAtlas2Based:{theta:.5,gravitationalConstant:-50,centralGravity:.01,springConstant:.08,springLength:100,damping:.4,avoidOverlap:0},repulsion:{centralGravity:.2,springLength:200,springConstant:.05,nodeDistance:100,damping:.09,avoidOverlap:0},hierarchicalRepulsion:{centralGravity:0,springLength:100,springConstant:.01,nodeDistance:120,damping:.09},maxVelocity:50,minVelocity:.75,solver:"barnesHut",stabilization:{enabled:!0,iterations:1e3,updateInterval:50,onlyDynamicEdges:!1,fit:!0},timestep:.5,adaptiveTimestep:!0},$r(this.options,this.defaultOptions),this.timestep=.5,this.layoutFailed=!1,this.bindEventListeners();}return Mc(t,[{key:"bindEventListeners",value:function(){var t=this;this.body.emitter.on("initPhysics",(function(){t.initPhysics();})),this.body.emitter.on("_layoutFailed",(function(){t.layoutFailed=!0;})),this.body.emitter.on("resetPhysics",(function(){t.stopSimulation(),t.ready=!1;})),this.body.emitter.on("disablePhysics",(function(){t.physicsEnabled=!1,t.stopSimulation();})),this.body.emitter.on("restorePhysics",(function(){t.setOptions(t.options),!0===t.ready&&t.startSimulation();})),this.body.emitter.on("startSimulation",(function(){!0===t.ready&&t.startSimulation();})),this.body.emitter.on("stopSimulation",(function(){t.stopSimulation();})),this.body.emitter.on("destroy",(function(){t.stopSimulation(!1),t.body.emitter.off();})),this.body.emitter.on("_dataChanged",(function(){t.updatePhysicsData();}));}},{key:"setOptions",value:function(t){void 0!==t&&(!1===t?(this.options.enabled=!1,this.physicsEnabled=!1,this.stopSimulation()):!0===t?(this.options.enabled=!0,this.physicsEnabled=!0,this.startSimulation()):(this.physicsEnabled=!0,ts(["stabilization"],this.options,t),Ls(this.options,t,"stabilization"),void 0===t.enabled&&(this.options.enabled=!0),!1===this.options.enabled&&(this.physicsEnabled=!1,this.stopSimulation()),this.timestep=this.options.timestep)),this.init();}},{key:"init",value:function(){var t;"forceAtlas2Based"===this.options.solver?(t=this.options.forceAtlas2Based,this.nodesSolver=new tD(this.body,this.physicsBody,t),this.edgesSolver=new $E(this.body,this.physicsBody,t),this.gravitySolver=new eD(this.body,this.physicsBody,t)):"repulsion"===this.options.solver?(t=this.options.repulsion,this.nodesSolver=new XE(this.body,this.physicsBody,t),this.edgesSolver=new $E(this.body,this.physicsBody,t),this.gravitySolver=new QE(this.body,this.physicsBody,t)):"hierarchicalRepulsion"===this.options.solver?(t=this.options.hierarchicalRepulsion,this.nodesSolver=new KE(this.body,this.physicsBody,t),this.edgesSolver=new JE(this.body,this.physicsBody,t),this.gravitySolver=new QE(this.body,this.physicsBody,t)):(t=this.options.barnesHut,this.nodesSolver=new qE(this.body,this.physicsBody,t),this.edgesSolver=new $E(this.body,this.physicsBody,t),this.gravitySolver=new QE(this.body,this.physicsBody,t)),this.modelOptions=t;}},{key:"initPhysics",value:function(){!0===this.physicsEnabled&&!0===this.options.enabled?!0===this.options.stabilization.enabled?this.stabilize():(this.stabilized=!1,this.ready=!0,this.body.emitter.emit("fit",{},this.layoutFailed),this.startSimulation()):(this.ready=!0,this.body.emitter.emit("fit"));}},{key:"startSimulation",value:function(){var t;!0===this.physicsEnabled&&!0===this.options.enabled?(this.stabilized=!1,this.adaptiveTimestep=!1,this.body.emitter.emit("_resizeNodes"),void 0===this.viewFunction&&(this.viewFunction=$(t=this.simulationStep).call(t,this),this.body.emitter.on("initRedraw",this.viewFunction),this.body.emitter.emit("_startRendering"))):this.body.emitter.emit("_redraw");}},{key:"stopSimulation",value:function(){var t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.stabilized=!0,!0===t&&this._emitStabilized(),void 0!==this.viewFunction&&(this.body.emitter.off("initRedraw",this.viewFunction),this.viewFunction=void 0,!0===t&&this.body.emitter.emit("_stopRendering"));}},{key:"simulationStep",value:function(){var t=GE();this.physicsTick(),(GE()-t<.4*this.simulationInterval||!0===this.runDoubleSpeed)&&!1===this.stabilized&&(this.physicsTick(),this.runDoubleSpeed=!0),!0===this.stabilized&&this.stopSimulation();}},{key:"_emitStabilized",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.stabilizationIterations;(this.stabilizationIterations>1||!0===this.startedStabilization)&&Ic((function(){t.body.emitter.emit("stabilized",{iterations:e}),t.startedStabilization=!1,t.stabilizationIterations=0;}),0);}},{key:"physicsStep",value:function(){this.gravitySolver.solve(),this.nodesSolver.solve(),this.edgesSolver.solve(),this.moveNodes();}},{key:"adjustTimeStep",value:function(){!0===this._evaluateStepQuality()?this.timestep=1.2*this.timestep:this.timestep/1.2<this.options.timestep?this.timestep=this.options.timestep:(this.adaptiveCounter=-1,this.timestep=Math.max(this.options.timestep,this.timestep/1.2));}},{key:"physicsTick",value:function(){if(this._startStabilizing(),!0!==this.stabilized){if(!0===this.adaptiveTimestep&&!0===this.adaptiveTimestepEnabled)this.adaptiveCounter%this.adaptiveInterval==0?(this.timestep=2*this.timestep,this.physicsStep(),this.revert(),this.timestep=.5*this.timestep,this.physicsStep(),this.physicsStep(),this.adjustTimeStep()):this.physicsStep(),this.adaptiveCounter+=1;else this.timestep=this.options.timestep,this.physicsStep();!0===this.stabilized&&this.revert(),this.stabilizationIterations++;}}},{key:"updatePhysicsData",value:function(){this.physicsBody.forces={},this.physicsBody.physicsNodeIndices=[],this.physicsBody.physicsEdgeIndices=[];var t=this.body.nodes,e=this.body.edges;for(var i in t)t.hasOwnProperty(i)&&!0===t[i].options.physics&&this.physicsBody.physicsNodeIndices.push(t[i].id);for(var n in e)e.hasOwnProperty(n)&&!0===e[n].options.physics&&this.physicsBody.physicsEdgeIndices.push(e[n].id);for(var o=0;o<this.physicsBody.physicsNodeIndices.length;o++){var r=this.physicsBody.physicsNodeIndices[o];this.physicsBody.forces[r]={x:0,y:0},void 0===this.physicsBody.velocities[r]&&(this.physicsBody.velocities[r]={x:0,y:0});}for(var s in this.physicsBody.velocities)void 0===t[s]&&delete this.physicsBody.velocities[s];}},{key:"revert",value:function(){var t=kS(this.previousStates),e=this.body.nodes,i=this.physicsBody.velocities;this.referenceState={};for(var n=0;n<t.length;n++){var o=t[n];void 0!==e[o]?!0===e[o].options.physics&&(this.referenceState[o]={positions:{x:e[o].x,y:e[o].y}},i[o].x=this.previousStates[o].vx,i[o].y=this.previousStates[o].vy,e[o].x=this.previousStates[o].x,e[o].y=this.previousStates[o].y):delete this.previousStates[o];}}},{key:"_evaluateStepQuality",value:function(){var t,e,i=this.body.nodes,n=this.referenceState;for(var o in this.referenceState)if(this.referenceState.hasOwnProperty(o)&&void 0!==i[o]&&(t=i[o].x-n[o].positions.x,e=i[o].y-n[o].positions.y,Math.sqrt(Math.pow(t,2)+Math.pow(e,2))>.3))return !1;return !0}},{key:"moveNodes",value:function(){for(var t=this.physicsBody.physicsNodeIndices,e=0,i=0,n=0;n<t.length;n++){var o=t[n],r=this._performStep(o);e=Math.max(e,r),i+=r;}this.adaptiveTimestepEnabled=i/t.length<5,this.stabilized=e<this.options.minVelocity;}},{key:"calculateComponentVelocity",value:function(t,e,i){t+=(e-this.modelOptions.damping*t)/i*this.timestep;var n=this.options.maxVelocity||1e9;return Math.abs(t)>n&&(t=t>0?n:-n),t}},{key:"_performStep",value:function(t){var e=this.body.nodes[t],i=this.physicsBody.forces[t],n=this.physicsBody.velocities[t];return this.previousStates[t]={x:e.x,y:e.y,vx:n.x,vy:n.y},!1===e.options.fixed.x?(n.x=this.calculateComponentVelocity(n.x,i.x,e.options.mass),e.x+=n.x*this.timestep):(i.x=0,n.x=0),!1===e.options.fixed.y?(n.y=this.calculateComponentVelocity(n.y,i.y,e.options.mass),e.y+=n.y*this.timestep):(i.y=0,n.y=0),Math.sqrt(Math.pow(n.x,2)+Math.pow(n.y,2))}},{key:"_freezeNodes",value:function(){var t=this.body.nodes;for(var e in t)if(t.hasOwnProperty(e)&&t[e].x&&t[e].y){var i=t[e].options.fixed;this.freezeCache[e]={x:i.x,y:i.y},i.x=!0,i.y=!0;}}},{key:"_restoreFrozenNodes",value:function(){var t=this.body.nodes;for(var e in t)t.hasOwnProperty(e)&&void 0!==this.freezeCache[e]&&(t[e].options.fixed.x=this.freezeCache[e].x,t[e].options.fixed.y=this.freezeCache[e].y);this.freezeCache={};}},{key:"stabilize",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.options.stabilization.iterations;"number"!=typeof e&&(e=this.options.stabilization.iterations,console.log("The stabilize method needs a numeric amount of iterations. Switching to default: ",e)),0!==this.physicsBody.physicsNodeIndices.length?(this.adaptiveTimestep=this.options.adaptiveTimestep,this.body.emitter.emit("_resizeNodes"),this.stopSimulation(),this.stabilized=!1,this.body.emitter.emit("_blockRedraw"),this.targetIterations=e,!0===this.options.stabilization.onlyDynamicEdges&&this._freezeNodes(),this.stabilizationIterations=0,Ic((function(){return t._stabilizationBatch()}),0)):this.ready=!0;}},{key:"_startStabilizing",value:function(){return !0!==this.startedStabilization&&(this.body.emitter.emit("startStabilizing"),this.startedStabilization=!0,!0)}},{key:"_stabilizationBatch",value:function(){var t=this,e=function(){return !1===t.stabilized&&t.stabilizationIterations<t.targetIterations},i=function(){t.body.emitter.emit("stabilizationProgress",{iterations:t.stabilizationIterations,total:t.targetIterations});};this._startStabilizing()&&i();for(var n,o=0;e()&&o<this.options.stabilization.updateInterval;)this.physicsTick(),o++;(i(),e())?Ic($(n=this._stabilizationBatch).call(n,this),0):this._finalizeStabilization();}},{key:"_finalizeStabilization",value:function(){this.body.emitter.emit("_allowRedraw"),!0===this.options.stabilization.fit&&this.body.emitter.emit("fit"),!0===this.options.stabilization.onlyDynamicEdges&&this._restoreFrozenNodes(),this.body.emitter.emit("stabilizationIterationsDone"),this.body.emitter.emit("_requestRedraw"),!0===this.stabilized?this._emitStabilized():this.startSimulation(),this.ready=!0;}},{key:"_drawForces",value:function(t){for(var e=0;e<this.physicsBody.physicsNodeIndices.length;e++){var i=this.physicsBody.physicsNodeIndices[e],n=this.body.nodes[i],o=this.physicsBody.forces[i],r=Math.sqrt(Math.pow(o.x,2)+Math.pow(o.x,2)),s=Math.min(Math.max(5,r),15),a=3*s,h=Cs((180-180*Math.min(1,Math.max(0,.03*r)))/360,1,1),l={x:n.x+20*o.x,y:n.y+20*o.y};t.lineWidth=s,t.strokeStyle=h,t.beginPath(),t.moveTo(n.x,n.y),t.lineTo(l.x,l.y),t.stroke();var d=Math.atan2(o.y,o.x);t.fillStyle=h,IE.draw(t,{type:"arrow",point:l,angle:d,length:a}),AM(t).call(t);}}}]),t}(),nD=[].reverse,oD=[1,2];W({target:"Array",proto:!0,forced:String(oD)===String(oD.reverse())},{reverse:function(){return Sh(this)&&(this.length=this.length),nD.call(this)}});var rD=X("Array").reverse,sD=Array.prototype,aD=function(t){var e=t.reverse;return t===sD||t instanceof Array&&e===sD.reverse?rD:e},hD=function(){function t(){kc(this,t);}return Mc(t,null,[{key:"getRange",value:function(t){var e,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],n=1e9,o=-1e9,r=1e9,s=-1e9;if(i.length>0)for(var a=0;a<i.length;a++)r>(e=t[i[a]]).shape.boundingBox.left&&(r=e.shape.boundingBox.left),s<e.shape.boundingBox.right&&(s=e.shape.boundingBox.right),n>e.shape.boundingBox.top&&(n=e.shape.boundingBox.top),o<e.shape.boundingBox.bottom&&(o=e.shape.boundingBox.bottom);return 1e9===r&&-1e9===s&&1e9===n&&-1e9===o&&(n=0,o=0,r=0,s=0),{minX:r,maxX:s,minY:n,maxY:o}}},{key:"getRangeCore",value:function(t){var e,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],n=1e9,o=-1e9,r=1e9,s=-1e9;if(i.length>0)for(var a=0;a<i.length;a++)r>(e=t[i[a]]).x&&(r=e.x),s<e.x&&(s=e.x),n>e.y&&(n=e.y),o<e.y&&(o=e.y);return 1e9===r&&-1e9===s&&1e9===n&&-1e9===o&&(n=0,o=0,r=0,s=0),{minX:r,maxX:s,minY:n,maxY:o}}},{key:"findCenter",value:function(t){return {x:.5*(t.maxX+t.minX),y:.5*(t.maxY+t.minY)}}},{key:"cloneOptions",value:function(t,e){var i={};return void 0===e||"node"===e?(es(i,t.options,!0),i.x=t.x,i.y=t.y,i.amountOfConnections=t.edges.length):es(i,t.options,!0),i}}]),t}(),lD=function(t){function e(t,i,n,o,r,s){var a;return kc(this,e),(a=kM(this,MM(e).call(this,t,i,n,o,r,s))).isCluster=!0,a.containedNodes={},a.containedEdges={},a}return TM(e,lE),Mc(e,[{key:"_openChildCluster",value:function(t){var e=this,i=this.body.nodes[t];if(void 0===this.containedNodes[t])throw new Error("node with id: "+t+" not in current cluster");if(!i.isCluster)throw new Error("node with id: "+t+" is not a cluster");delete this.containedNodes[t],us(i.edges,(function(t){delete e.containedEdges[t.id];})),us(i.containedNodes,(function(t,i){e.containedNodes[i]=t;})),i.containedNodes={},us(i.containedEdges,(function(t,i){e.containedEdges[i]=t;})),i.containedEdges={},us(i.edges,(function(t){us(e.edges,(function(i){var n,o,r=yl(n=i.clusteringEdgeReplacingIds).call(n,t.id);-1!==r&&(us(t.clusteringEdgeReplacingIds,(function(t){i.clusteringEdgeReplacingIds.push(t),e.body.edges[t].edgeReplacedById=i.id;})),tl(o=i.clusteringEdgeReplacingIds).call(o,r,1));}));})),i.edges=[];}}]),e}(),dD=function(){function t(e){var i=this;kc(this,t),this.body=e,this.clusteredNodes={},this.clusteredEdges={},this.options={},this.defaultOptions={},$r(this.options,this.defaultOptions),this.body.emitter.on("_resetData",(function(){i.clusteredNodes={},i.clusteredEdges={};}));}return Mc(t,[{key:"clusterByHubsize",value:function(t,e){void 0===t?t=this._getHubSize():"object"===QS(t)&&(e=this._checkOptions(t),t=this._getHubSize());for(var i=[],n=0;n<this.body.nodeIndices.length;n++){var o=this.body.nodes[this.body.nodeIndices[n]];o.edges.length>=t&&i.push(o.id);}for(var r=0;r<i.length;r++)this.clusterByConnection(i[r],e,!0);this.body.emitter.emit("_dataChanged");}},{key:"cluster",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if(void 0===e.joinCondition)throw new Error("Cannot call clusterByNodeData without a joinCondition function in the options.");e=this._checkOptions(e);var n={},o={};us(this.body.nodes,(function(i,r){i.options&&!0===e.joinCondition(i.options)&&(n[r]=i,us(i.edges,(function(e){void 0===t.clusteredEdges[e.id]&&(o[e.id]=e);})));})),this._cluster(n,o,e,i);}},{key:"clusterByEdgeCount",value:function(t,e){var i=this,n=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];e=this._checkOptions(e);for(var o,r,s,a=[],h={},l=function(n){var l={},d={},f=i.body.nodeIndices[n],p=i.body.nodes[f];if(void 0===h[f]){s=0,r=[];for(var v=0;v<p.edges.length;v++)o=p.edges[v],void 0===i.clusteredEdges[o.id]&&(o.toId!==o.fromId&&s++,r.push(o));if(s===t){u=function(t){if(void 0===e.joinCondition||null===e.joinCondition)return !0;var i=hD.cloneOptions(t);return e.joinCondition(i)};for(var y=!0,g=0;g<r.length;g++){o=r[g];var m=i._getConnectedId(o,f);if(!u(p)){y=!1;break}d[o.id]=o,l[f]=p,l[m]=i.body.nodes[m],h[f]=!0;}if(kS(l).length>0&&kS(d).length>0&&!0===y)if(void 0!==(c=function(){for(var t=0;t<a.length;++t)for(var e in l)if(void 0!==a[t].nodes[e])return a[t]}())){for(var b in l)void 0===c.nodes[b]&&(c.nodes[b]=l[b]);for(var w in d)void 0===c.edges[w]&&(c.edges[w]=d[w]);}else a.push({nodes:l,edges:d});}}},d=0;d<this.body.nodeIndices.length;d++){var u,c;l(d);}for(var f=0;f<a.length;f++)this._cluster(a[f].nodes,a[f].edges,e,!1);!0===n&&this.body.emitter.emit("_dataChanged");}},{key:"clusterOutliers",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];this.clusterByEdgeCount(1,t,e);}},{key:"clusterBridges",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];this.clusterByEdgeCount(2,t,e);}},{key:"clusterByConnection",value:function(t,e){var i,n=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if(void 0===t)throw new Error("No nodeId supplied to clusterByConnection!");if(void 0===this.body.nodes[t])throw new Error("The nodeId given to clusterByConnection does not exist!");var o=this.body.nodes[t];void 0===(e=this._checkOptions(e,o)).clusterNodeProperties.x&&(e.clusterNodeProperties.x=o.x),void 0===e.clusterNodeProperties.y&&(e.clusterNodeProperties.y=o.y),void 0===e.clusterNodeProperties.fixed&&(e.clusterNodeProperties.fixed={},e.clusterNodeProperties.fixed.x=o.options.fixed.x,e.clusterNodeProperties.fixed.y=o.options.fixed.y);var r={},s={},a=o.id,h=hD.cloneOptions(o);r[a]=o;for(var l=0;l<o.edges.length;l++){var d=o.edges[l];if(void 0===this.clusteredEdges[d.id]){var u=this._getConnectedId(d,a);if(void 0===this.clusteredNodes[u])if(u!==a)if(void 0===e.joinCondition)s[d.id]=d,r[u]=this.body.nodes[u];else{var c=hD.cloneOptions(this.body.nodes[u]);!0===e.joinCondition(h,c)&&(s[d.id]=d,r[u]=this.body.nodes[u]);}else s[d.id]=d;}}var f=od(i=kS(r)).call(i,(function(t){return r[t].id}));for(p in r)if(r.hasOwnProperty(p))for(var p=r[p],v=0;v<p.edges.length;v++){var y=p.edges[v];yl(f).call(f,this._getConnectedId(y,p.id))>-1&&(s[y.id]=y);}this._cluster(r,s,e,n);}},{key:"_createClusterEdges",value:function(t,e,i,n){for(var o,r,s,a,h,l,d=kS(t),u=[],c=0;c<d.length;c++){s=t[r=d[c]];for(var f=0;f<s.edges.length;f++)o=s.edges[f],void 0===this.clusteredEdges[o.id]&&(o.toId==o.fromId?e[o.id]=o:o.toId==r?(a=i.id,l=h=o.fromId):(a=o.toId,h=i.id,l=a),void 0===t[l]&&u.push({edge:o,fromId:h,toId:a}));}for(var p=[],v=function(t){for(var e=0;e<p.length;e++){var i=p[e],n=t.fromId===i.fromId&&t.toId===i.toId,o=t.fromId===i.toId&&t.toId===i.fromId;if(n||o)return i}return null},y=0;y<u.length;y++){var g=u[y],m=g.edge,b=v(g);null===b?(b=this._createClusteredEdge(g.fromId,g.toId,m,n),p.push(b)):b.clusteringEdgeReplacingIds.push(m.id),this.body.edges[m.id].edgeReplacedById=b.id,this._backupEdgeOptions(m),m.setOptions({physics:!1});}}},{key:"_checkOptions",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return void 0===t.clusterEdgeProperties&&(t.clusterEdgeProperties={}),void 0===t.clusterNodeProperties&&(t.clusterNodeProperties={}),t}},{key:"_cluster",value:function(t,e,i){var n=!(arguments.length>3&&void 0!==arguments[3])||arguments[3],o=[];for(var r in t)t.hasOwnProperty(r)&&void 0!==this.clusteredNodes[r]&&o.push(r);for(var s=0;s<o.length;++s)delete t[o[s]];if(0!=kS(t).length&&(1!=kS(t).length||1==i.clusterNodeProperties.allowSingleNodeCluster)){var a=es({},i.clusterNodeProperties);if(void 0!==i.processProperties){var h=[];for(var l in t)if(t.hasOwnProperty(l)){var d=hD.cloneOptions(t[l]);h.push(d);}var u=[];for(var c in e)if(e.hasOwnProperty(c)&&"clusterEdge:"!==c.substr(0,12)){var f=hD.cloneOptions(e[c],"edge");u.push(f);}if(!(a=i.processProperties(a,h,u)))throw new Error("The processProperties function does not return properties!")}void 0===a.id&&(a.id="cluster:"+zr());var p=a.id;void 0===a.label&&(a.label="cluster");var v=void 0;void 0===a.x&&(v=this._getClusterPosition(t),a.x=v.x),void 0===a.y&&(void 0===v&&(v=this._getClusterPosition(t)),a.y=v.y),a.id=p;var y=this.body.functions.createNode(a,lD);y.containedNodes=t,y.containedEdges=e,y.clusterEdgeProperties=i.clusterEdgeProperties,this.body.nodes[a.id]=y,this._clusterEdges(t,e,a,i.clusterEdgeProperties),a.id=void 0,!0===n&&this.body.emitter.emit("_dataChanged");}}},{key:"_backupEdgeOptions",value:function(t){void 0===this.clusteredEdges[t.id]&&(this.clusteredEdges[t.id]={physics:t.options.physics});}},{key:"_restoreEdge",value:function(t){var e=this.clusteredEdges[t.id];void 0!==e&&(t.setOptions({physics:e.physics}),delete this.clusteredEdges[t.id]);}},{key:"isCluster",value:function(t){return void 0!==this.body.nodes[t]?!0===this.body.nodes[t].isCluster:(console.log("Node does not exist."),!1)}},{key:"_getClusterPosition",value:function(t){for(var e,i=kS(t),n=t[i[0]].x,o=t[i[0]].x,r=t[i[0]].y,s=t[i[0]].y,a=1;a<i.length;a++)n=(e=t[i[a]]).x<n?e.x:n,o=e.x>o?e.x:o,r=e.y<r?e.y:r,s=e.y>s?e.y:s;return {x:.5*(n+o),y:.5*(r+s)}}},{key:"openCluster",value:function(t,e){var i=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if(void 0===t)throw new Error("No clusterNodeId supplied to openCluster.");var n=this.body.nodes[t];if(void 0===n)throw new Error("The clusterNodeId supplied to openCluster does not exist.");if(!0!==n.isCluster||void 0===n.containedNodes||void 0===n.containedEdges)throw new Error("The node:"+t+" is not a valid cluster.");var o=this.findNode(t),r=yl(o).call(o,t)-1;if(r>=0){var s=o[r],a=this.body.nodes[s];return a._openChildCluster(t),delete this.body.nodes[t],void(!0===i&&this.body.emitter.emit("_dataChanged"))}var h=n.containedNodes,l=n.containedEdges;if(void 0!==e&&void 0!==e.releaseFunction&&"function"==typeof e.releaseFunction){var d={},u={x:n.x,y:n.y};for(var c in h)if(h.hasOwnProperty(c)){var f=this.body.nodes[c];d[c]={x:f.x,y:f.y};}var p=e.releaseFunction(u,d);for(var v in h)if(h.hasOwnProperty(v)){var y=this.body.nodes[v];void 0!==p[v]&&(y.x=void 0===p[v].x?n.x:p[v].x,y.y=void 0===p[v].y?n.y:p[v].y);}}else us(h,(function(t){!1===t.options.fixed.x&&(t.x=n.x),!1===t.options.fixed.y&&(t.y=n.y);}));for(var g in h)if(h.hasOwnProperty(g)){var m=this.body.nodes[g];m.vx=n.vx,m.vy=n.vy,m.setOptions({physics:!0}),delete this.clusteredNodes[g];}for(var b=[],w=0;w<n.edges.length;w++)b.push(n.edges[w]);for(var _=0;_<b.length;_++){for(var k=b[_],x=this._getConnectedId(k,t),O=this.clusteredNodes[x],S=0;S<k.clusteringEdgeReplacingIds.length;S++){var M=k.clusteringEdgeReplacingIds[S],E=this.body.edges[M];if(void 0!==E)if(void 0!==O){var D=this.body.nodes[O.clusterId];D.containedEdges[E.id]=E,delete l[E.id];var T=E.fromId,C=E.toId;E.toId==x?C=O.clusterId:T=O.clusterId,this._createClusteredEdge(T,C,E,D.clusterEdgeProperties,{hidden:!1,physics:!0});}else this._restoreEdge(E);}k.remove();}for(var P in l)l.hasOwnProperty(P)&&this._restoreEdge(l[P]);delete this.body.nodes[t],!0===i&&this.body.emitter.emit("_dataChanged");}},{key:"getNodesInCluster",value:function(t){var e=[];if(!0===this.isCluster(t)){var i=this.body.nodes[t].containedNodes;for(var n in i)i.hasOwnProperty(n)&&e.push(this.body.nodes[n].id);}return e}},{key:"findNode",value:function(t){for(var e,i=[],n=0;void 0!==this.clusteredNodes[t]&&n<100;){if(void 0===(e=this.body.nodes[t]))return [];i.push(e.id),t=this.clusteredNodes[t].clusterId,n++;}return void 0===(e=this.body.nodes[t])?[]:(i.push(e.id),aD(i).call(i),i)}},{key:"updateClusteredNode",value:function(t,e){if(void 0===t)throw new Error("No clusteredNodeId supplied to updateClusteredNode.");if(void 0===e)throw new Error("No newOptions supplied to updateClusteredNode.");if(void 0===this.body.nodes[t])throw new Error("The clusteredNodeId supplied to updateClusteredNode does not exist.");this.body.nodes[t].setOptions(e),this.body.emitter.emit("_dataChanged");}},{key:"updateEdge",value:function(t,e){if(void 0===t)throw new Error("No startEdgeId supplied to updateEdge.");if(void 0===e)throw new Error("No newOptions supplied to updateEdge.");if(void 0===this.body.edges[t])throw new Error("The startEdgeId supplied to updateEdge does not exist.");for(var i=this.getClusteredEdges(t),n=0;n<i.length;n++){this.body.edges[i[n]].setOptions(e);}this.body.emitter.emit("_dataChanged");}},{key:"getClusteredEdges",value:function(t){for(var e=[],i=0;void 0!==t&&void 0!==this.body.edges[t]&&i<100;)e.push(this.body.edges[t].id),t=this.body.edges[t].edgeReplacedById,i++;return aD(e).call(e),e}},{key:"getBaseEdge",value:function(t){return this.getBaseEdges(t)[0]}},{key:"getBaseEdges",value:function(t){for(var e=[t],i=[],n=[],o=0;e.length>0&&o<100;){var r=e.pop();if(void 0!==r){var s=this.body.edges[r];if(void 0!==s){o++;var a=s.clusteringEdgeReplacingIds;if(void 0===a)n.push(r);else for(var h=0;h<a.length;++h){var l=a[h];-1===yl(e).call(e,a)&&-1===yl(i).call(i,a)&&e.push(l);}i.push(r);}}}return n}},{key:"_getConnectedId",value:function(t,e){return t.toId!=e?t.toId:(t.fromId,t.fromId)}},{key:"_getHubSize",value:function(){for(var t=0,e=0,i=0,n=0,o=0;o<this.body.nodeIndices.length;o++){var r=this.body.nodes[this.body.nodeIndices[o]];r.edges.length>n&&(n=r.edges.length),t+=r.edges.length,e+=Math.pow(r.edges.length,2),i+=1;}t/=i;var s=(e/=i)-Math.pow(t,2),a=Math.sqrt(s),h=Math.floor(t+2*a);return h>n&&(h=n),h}},{key:"_createClusteredEdge",value:function(t,e,i,n,o){var r=hD.cloneOptions(i,"edge");es(r,n),r.from=t,r.to=e,r.id="clusterEdge:"+zr(),void 0!==o&&es(r,o);var s=this.body.functions.createEdge(r);return s.clusteringEdgeReplacingIds=[i.id],s.connect(),this.body.edges[s.id]=s,s}},{key:"_clusterEdges",value:function(t,e,i,n){if(e instanceof VE){var o=e,r={};r[o.id]=o,e=r;}if(t instanceof lE){var s=t,a={};a[s.id]=s,t=a;}if(null==i)throw new Error("_clusterEdges: parameter clusterNode required");for(var h in void 0===n&&(n=i.clusterEdgeProperties),this._createClusterEdges(t,e,i,n),e)if(e.hasOwnProperty(h)&&void 0!==this.body.edges[h]){var l=this.body.edges[h];this._backupEdgeOptions(l),l.setOptions({physics:!1});}for(var d in t)t.hasOwnProperty(d)&&(this.clusteredNodes[d]={clusterId:i.id,node:this.body.nodes[d]},this.body.nodes[d].setOptions({physics:!1}));}},{key:"_getClusterNodeForNode",value:function(t){if(void 0!==t){var e=this.clusteredNodes[t];if(void 0!==e){var i=e.clusterId;if(void 0!==i)return this.body.nodes[i]}}}},{key:"_filter",value:function(t,e){var i=[];return us(t,(function(t){e(t)&&i.push(t);})),i}},{key:"_updateState",value:function(){var t,e=this,i=[],n={},o=function(t){us(e.body.nodes,(function(e){!0===e.isCluster&&t(e);}));};for(t in this.clusteredNodes){if(this.clusteredNodes.hasOwnProperty(t))void 0===this.body.nodes[t]&&i.push(t);}o((function(t){for(var e=0;e<i.length;e++)delete t.containedNodes[i[e]];}));for(var r=0;r<i.length;r++)delete this.clusteredNodes[i[r]];us(this.clusteredEdges,(function(t){var i=e.body.edges[t];void 0!==i&&i.endPointsValid()||(n[t]=t);})),o((function(t){us(t.containedEdges,(function(t,e){t.endPointsValid()||n[e]||(n[e]=e);}));})),us(this.body.edges,(function(t,i){var o=!0,r=t.clusteringEdgeReplacingIds;if(void 0!==r){var s=0;us(r,(function(t){var i=e.body.edges[t];void 0!==i&&i.endPointsValid()&&(s+=1);})),o=s>0;}t.endPointsValid()&&o||(n[i]=i);})),o((function(t){us(n,(function(i){delete t.containedEdges[i],us(t.edges,(function(o,r){o.id!==i?o.clusteringEdgeReplacingIds=e._filter(o.clusteringEdgeReplacingIds,(function(t){return !n[t]})):t.edges[r]=null;})),t.edges=e._filter(t.edges,(function(t){return null!==t}));}));})),us(n,(function(t){delete e.clusteredEdges[t];})),us(n,(function(t){delete e.body.edges[t];})),us(kS(this.body.edges),(function(t){var i=e.body.edges[t],n=e._isClusteredNode(i.fromId)||e._isClusteredNode(i.toId);if(n!==e._isClusteredEdge(i.id))if(n){var o=e._getClusterNodeForNode(i.fromId);void 0!==o&&e._clusterEdges(e.body.nodes[i.fromId],i,o);var r=e._getClusterNodeForNode(i.toId);void 0!==r&&e._clusterEdges(e.body.nodes[i.toId],i,r);}else delete e._clusterEdges[t],e._restoreEdge(i);}));for(var s=!1,a=!0,h=function(){var t=[];o((function(e){var i=kS(e.containedNodes).length,n=!0===e.options.allowSingleNodeCluster;(n&&i<1||!n&&i<2)&&t.push(e.id);}));for(var i=0;i<t.length;++i)e.openCluster(t[i],{},!1);a=t.length>0,s=s||a;};a;)h();s&&this._updateState();}},{key:"_isClusteredNode",value:function(t){return void 0!==this.clusteredNodes[t]}},{key:"_isClusteredEdge",value:function(t){return void 0!==this.clusteredEdges[t]}}]),t}();var uD=function(){function t(e,i){var n;kc(this,t),void 0!==window&&(n=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame),window.requestAnimationFrame=void 0===n?function(t){t();}:n,this.body=e,this.canvas=i,this.redrawRequested=!1,this.renderTimer=void 0,this.requiresTimeout=!0,this.renderingActive=!1,this.renderRequests=0,this.allowRedraw=!0,this.dragging=!1,this.zooming=!1,this.options={},this.defaultOptions={hideEdgesOnDrag:!1,hideEdgesOnZoom:!1,hideNodesOnDrag:!1},$r(this.options,this.defaultOptions),this._determineBrowserMethod(),this.bindEventListeners();}return Mc(t,[{key:"bindEventListeners",value:function(){var t,e=this;this.body.emitter.on("dragStart",(function(){e.dragging=!0;})),this.body.emitter.on("dragEnd",(function(){e.dragging=!1;})),this.body.emitter.on("zoom",(function(){e.zooming=!0,window.clearTimeout(e.zoomTimeoutId),e.zoomTimeoutId=window.setTimeout((function(){var t;e.zooming=!1,$(t=e._requestRedraw).call(t,e)();}),250);})),this.body.emitter.on("_resizeNodes",(function(){e._resizeNodes();})),this.body.emitter.on("_redraw",(function(){!1===e.renderingActive&&e._redraw();})),this.body.emitter.on("_blockRedraw",(function(){e.allowRedraw=!1;})),this.body.emitter.on("_allowRedraw",(function(){e.allowRedraw=!0,e.redrawRequested=!1;})),this.body.emitter.on("_requestRedraw",$(t=this._requestRedraw).call(t,this)),this.body.emitter.on("_startRendering",(function(){e.renderRequests+=1,e.renderingActive=!0,e._startRendering();})),this.body.emitter.on("_stopRendering",(function(){e.renderRequests-=1,e.renderingActive=e.renderRequests>0,e.renderTimer=void 0;})),this.body.emitter.on("destroy",(function(){e.renderRequests=0,e.allowRedraw=!1,e.renderingActive=!1,!0===e.requiresTimeout?clearTimeout(e.renderTimer):window.cancelAnimationFrame(e.renderTimer),e.body.emitter.off();}));}},{key:"setOptions",value:function(t){if(void 0!==t){Qr(["hideEdgesOnDrag","hideEdgesOnZoom","hideNodesOnDrag"],this.options,t);}}},{key:"_requestNextFrame",value:function(t,e){if("undefined"!=typeof window){var i,n=window;return !0===this.requiresTimeout?i=n.setTimeout(t,e):n.requestAnimationFrame&&(i=n.requestAnimationFrame(t)),i}}},{key:"_startRendering",value:function(){var t;!0===this.renderingActive&&(void 0===this.renderTimer&&(this.renderTimer=this._requestNextFrame($(t=this._renderStep).call(t,this),this.simulationInterval)));}},{key:"_renderStep",value:function(){!0===this.renderingActive&&(this.renderTimer=void 0,!0===this.requiresTimeout&&this._startRendering(),this._redraw(),!1===this.requiresTimeout&&this._startRendering());}},{key:"redraw",value:function(){this.body.emitter.emit("setSize"),this._redraw();}},{key:"_requestRedraw",value:function(){var t=this;!0!==this.redrawRequested&&!1===this.renderingActive&&!0===this.allowRedraw&&(this.redrawRequested=!0,this._requestNextFrame((function(){t._redraw(!1);}),0));}},{key:"_redraw",value:function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(!0===this.allowRedraw){this.body.emitter.emit("initRedraw"),this.redrawRequested=!1,0!==this.canvas.frame.canvas.width&&0!==this.canvas.frame.canvas.height||this.canvas.setSize(),this.canvas.setTransform();var e=this.canvas.getContext(),i=this.canvas.frame.canvas.clientWidth,n=this.canvas.frame.canvas.clientHeight;if(e.clearRect(0,0,i,n),0===this.canvas.frame.clientWidth)return;e.save(),e.translate(this.body.view.translation.x,this.body.view.translation.y),e.scale(this.body.view.scale,this.body.view.scale),e.beginPath(),this.body.emitter.emit("beforeDrawing",e),e.closePath(),!1===t&&(!1===this.dragging||!0===this.dragging&&!1===this.options.hideEdgesOnDrag)&&(!1===this.zooming||!0===this.zooming&&!1===this.options.hideEdgesOnZoom)&&this._drawEdges(e),(!1===this.dragging||!0===this.dragging&&!1===this.options.hideNodesOnDrag)&&this._drawNodes(e,t),e.beginPath(),this.body.emitter.emit("afterDrawing",e),e.closePath(),e.restore(),!0===t&&e.clearRect(0,0,i,n);}}},{key:"_resizeNodes",value:function(){this.canvas.setTransform();var t=this.canvas.getContext();t.save(),t.translate(this.body.view.translation.x,this.body.view.translation.y),t.scale(this.body.view.scale,this.body.view.scale);var e,i=this.body.nodes;for(var n in i)i.hasOwnProperty(n)&&((e=i[n]).resize(t),e.updateBoundingBox(t,e.selected));t.restore();}},{key:"_drawNodes",value:function(t){for(var e,i=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=this.body.nodes,o=this.body.nodeIndices,r=[],s=20,a=this.canvas.DOMtoCanvas({x:-s,y:-s}),h=this.canvas.DOMtoCanvas({x:this.canvas.frame.canvas.clientWidth+s,y:this.canvas.frame.canvas.clientHeight+s}),l={top:a.y,left:a.x,bottom:h.y,right:h.x},d=0;d<o.length;d++)(e=n[o[d]]).isSelected()?r.push(o[d]):!0===i?e.draw(t):!0===e.isBoundingBoxOverlappingWith(l)?e.draw(t):e.updateBoundingBox(t,e.selected);for(var u=0;u<r.length;u++)(e=n[r[u]]).draw(t);}},{key:"_drawEdges",value:function(t){for(var e,i=this.body.edges,n=this.body.edgeIndices,o=0;o<n.length;o++)!0===(e=i[n[o]]).connected&&e.draw(t);}},{key:"_determineBrowserMethod",value:function(){if("undefined"!=typeof window){var t=navigator.userAgent.toLowerCase();this.requiresTimeout=!1,-1!=yl(t).call(t,"msie 9.0")?this.requiresTimeout=!0:-1!=yl(t).call(t,"safari")&&yl(t).call(t,"chrome")<=-1&&(this.requiresTimeout=!0);}else this.requiresTimeout=!0;}}]),t}(),cD=F.setInterval,fD=i((function(t,e){e.onTouch=function(t,e){e.inputHandler=function(t){t.isFirst&&e(t);},t.on("hammer.input",e.inputHandler);},e.onRelease=function(t,e){return e.inputHandler=function(t){t.isFinal&&e(t);},t.on("hammer.input",e.inputHandler)},e.offTouch=function(t,e){t.off("hammer.input",e.inputHandler);},e.offRelease=e.offTouch,e.disablePreventDefaultVertically=function(t){return t.getTouchAction=function(){return ["pan-y"]},t};})),pD=(fD.onTouch,fD.onRelease,fD.offTouch,fD.offRelease,fD.disablePreventDefaultVertically,function(){function t(e){var i;kc(this,t),this.body=e,this.pixelRatio=1,this.resizeTimer=void 0,this.resizeFunction=$(i=this._onResize).call(i,this),this.cameraState={},this.initialized=!1,this.canvasViewCenter={},this.options={},this.defaultOptions={autoResize:!0,height:"100%",width:"100%"},$r(this.options,this.defaultOptions),this.bindEventListeners();}return Mc(t,[{key:"bindEventListeners",value:function(){var t,e=this;this.body.emitter.once("resize",(function(t){0!==t.width&&(e.body.view.translation.x=.5*t.width),0!==t.height&&(e.body.view.translation.y=.5*t.height);})),this.body.emitter.on("setSize",$(t=this.setSize).call(t,this)),this.body.emitter.on("destroy",(function(){e.hammerFrame.destroy(),e.hammer.destroy(),e._cleanUp();}));}},{key:"setOptions",value:function(t){var e,i=this;if(void 0!==t){Qr(["width","height","autoResize"],this.options,t);}!0===this.options.autoResize&&(this._cleanUp(),this.resizeTimer=cD((function(){!0===i.setSize()&&i.body.emitter.emit("_requestRedraw");}),1e3),this.resizeFunction=$(e=this._onResize).call(e,this),vs(window,"resize",this.resizeFunction));}},{key:"_cleanUp",value:function(){void 0!==this.resizeTimer&&clearInterval(this.resizeTimer),ys(window,"resize",this.resizeFunction),this.resizeFunction=void 0;}},{key:"_onResize",value:function(){this.setSize(),this.body.emitter.emit("_redraw");}},{key:"_getCameraState",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.pixelRatio;!0===this.initialized&&(this.cameraState.previousWidth=this.frame.canvas.width/t,this.cameraState.previousHeight=this.frame.canvas.height/t,this.cameraState.scale=this.body.view.scale,this.cameraState.position=this.DOMtoCanvas({x:.5*this.frame.canvas.width/t,y:.5*this.frame.canvas.height/t}));}},{key:"_setCameraState",value:function(){if(void 0!==this.cameraState.scale&&0!==this.frame.canvas.clientWidth&&0!==this.frame.canvas.clientHeight&&0!==this.pixelRatio&&this.cameraState.previousWidth>0){var t=this.frame.canvas.width/this.pixelRatio/this.cameraState.previousWidth,e=this.frame.canvas.height/this.pixelRatio/this.cameraState.previousHeight,i=this.cameraState.scale;1!=t&&1!=e?i=.5*this.cameraState.scale*(t+e):1!=t?i=this.cameraState.scale*t:1!=e&&(i=this.cameraState.scale*e),this.body.view.scale=i;var n=this.DOMtoCanvas({x:.5*this.frame.canvas.clientWidth,y:.5*this.frame.canvas.clientHeight}),o={x:n.x-this.cameraState.position.x,y:n.y-this.cameraState.position.y};this.body.view.translation.x+=o.x*this.body.view.scale,this.body.view.translation.y+=o.y*this.body.view.scale;}}},{key:"_prepareValue",value:function(t){if("number"==typeof t)return t+"px";if("string"==typeof t){if(-1!==yl(t).call(t,"%")||-1!==yl(t).call(t,"px"))return t;if(-1===yl(t).call(t,"%"))return t+"px"}throw new Error("Could not use the value supplied for width or height:"+t)}},{key:"_create",value:function(){for(;this.body.container.hasChildNodes();)this.body.container.removeChild(this.body.container.firstChild);if(this.frame=document.createElement("div"),this.frame.className="vis-network",this.frame.style.position="relative",this.frame.style.overflow="hidden",this.frame.tabIndex=900,this.frame.canvas=document.createElement("canvas"),this.frame.canvas.style.position="relative",this.frame.appendChild(this.frame.canvas),this.frame.canvas.getContext)this._setPixelRatio(),this.setTransform();else{var t=document.createElement("DIV");t.style.color="red",t.style.fontWeight="bold",t.style.padding="10px",t.innerHTML="Error: your browser does not support HTML canvas",this.frame.canvas.appendChild(t);}this.body.container.appendChild(this.frame),this.body.view.scale=1,this.body.view.translation={x:.5*this.frame.canvas.clientWidth,y:.5*this.frame.canvas.clientHeight},this._bindHammer();}},{key:"_bindHammer",value:function(){var t=this;void 0!==this.hammer&&this.hammer.destroy(),this.drag={},this.pinch={},this.hammer=new gc(this.frame.canvas),this.hammer.get("pinch").set({enable:!0}),this.hammer.get("pan").set({threshold:5,direction:gc.DIRECTION_ALL}),fD.onTouch(this.hammer,(function(e){t.body.eventListeners.onTouch(e);})),this.hammer.on("tap",(function(e){t.body.eventListeners.onTap(e);})),this.hammer.on("doubletap",(function(e){t.body.eventListeners.onDoubleTap(e);})),this.hammer.on("press",(function(e){t.body.eventListeners.onHold(e);})),this.hammer.on("panstart",(function(e){t.body.eventListeners.onDragStart(e);})),this.hammer.on("panmove",(function(e){t.body.eventListeners.onDrag(e);})),this.hammer.on("panend",(function(e){t.body.eventListeners.onDragEnd(e);})),this.hammer.on("pinch",(function(e){t.body.eventListeners.onPinch(e);})),this.frame.canvas.addEventListener("wheel",(function(e){t.body.eventListeners.onMouseWheel(e);})),this.frame.canvas.addEventListener("mousemove",(function(e){t.body.eventListeners.onMouseMove(e);})),this.frame.canvas.addEventListener("contextmenu",(function(e){t.body.eventListeners.onContext(e);})),this.hammerFrame=new gc(this.frame),fD.onRelease(this.hammerFrame,(function(e){t.body.eventListeners.onRelease(e);}));}},{key:"setSize",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.options.width,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.options.height;t=this._prepareValue(t),e=this._prepareValue(e);var i=!1,n=this.frame.canvas.width,o=this.frame.canvas.height,r=this.pixelRatio;if(this._setPixelRatio(),t!=this.options.width||e!=this.options.height||this.frame.style.width!=t||this.frame.style.height!=e)this._getCameraState(r),this.frame.style.width=t,this.frame.style.height=e,this.frame.canvas.style.width="100%",this.frame.canvas.style.height="100%",this.frame.canvas.width=Math.round(this.frame.canvas.clientWidth*this.pixelRatio),this.frame.canvas.height=Math.round(this.frame.canvas.clientHeight*this.pixelRatio),this.options.width=t,this.options.height=e,this.canvasViewCenter={x:.5*this.frame.clientWidth,y:.5*this.frame.clientHeight},i=!0;else{var s=Math.round(this.frame.canvas.clientWidth*this.pixelRatio),a=Math.round(this.frame.canvas.clientHeight*this.pixelRatio);this.frame.canvas.width===s&&this.frame.canvas.height===a||this._getCameraState(r),this.frame.canvas.width!==s&&(this.frame.canvas.width=s,i=!0),this.frame.canvas.height!==a&&(this.frame.canvas.height=a,i=!0);}return !0===i&&(this.body.emitter.emit("resize",{width:Math.round(this.frame.canvas.width/this.pixelRatio),height:Math.round(this.frame.canvas.height/this.pixelRatio),oldWidth:Math.round(n/this.pixelRatio),oldHeight:Math.round(o/this.pixelRatio)}),this._setCameraState()),this.initialized=!0,i}},{key:"getContext",value:function(){return this.frame.canvas.getContext("2d")}},{key:"_determinePixelRatio",value:function(){var t=this.getContext();if(void 0===t)throw new Error("Could not get canvax context");var e=1;return "undefined"!=typeof window&&(e=window.devicePixelRatio||1),e/(t.webkitBackingStorePixelRatio||t.mozBackingStorePixelRatio||t.msBackingStorePixelRatio||t.oBackingStorePixelRatio||t.backingStorePixelRatio||1)}},{key:"_setPixelRatio",value:function(){this.pixelRatio=this._determinePixelRatio();}},{key:"setTransform",value:function(){var t=this.getContext();if(void 0===t)throw new Error("Could not get canvax context");t.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);}},{key:"_XconvertDOMtoCanvas",value:function(t){return (t-this.body.view.translation.x)/this.body.view.scale}},{key:"_XconvertCanvasToDOM",value:function(t){return t*this.body.view.scale+this.body.view.translation.x}},{key:"_YconvertDOMtoCanvas",value:function(t){return (t-this.body.view.translation.y)/this.body.view.scale}},{key:"_YconvertCanvasToDOM",value:function(t){return t*this.body.view.scale+this.body.view.translation.y}},{key:"canvasToDOM",value:function(t){return {x:this._XconvertCanvasToDOM(t.x),y:this._YconvertCanvasToDOM(t.y)}}},{key:"DOMtoCanvas",value:function(t){return {x:this._XconvertDOMtoCanvas(t.x),y:this._YconvertDOMtoCanvas(t.y)}}}]),t}()),vD=o.isFinite,yD=Number.isFinite||function(t){return "number"==typeof t&&vD(t)};W({target:"Number",stat:!0},{isFinite:yD});var gD=F.Number.isFinite,mD=function(){function t(e,i){var n,o,r=this;kc(this,t),this.body=e,this.canvas=i,this.animationSpeed=1/this.renderRefreshRate,this.animationEasingFunction="easeInOutQuint",this.easingTime=0,this.sourceScale=0,this.targetScale=0,this.sourceTranslation=0,this.targetTranslation=0,this.lockedOnNodeId=void 0,this.lockedOnNodeOffset=void 0,this.touchTime=0,this.viewFunction=void 0,this.body.emitter.on("fit",$(n=this.fit).call(n,this)),this.body.emitter.on("animationFinished",(function(){r.body.emitter.emit("_stopRendering");})),this.body.emitter.on("unlockNode",$(o=this.releaseNode).call(o,this));}return Mc(t,[{key:"setOptions",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.options=t;}},{key:"fit",value:function(){var t,e,i=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{nodes:[]},n=arguments.length>1&&void 0!==arguments[1]&&arguments[1];if(void 0!==(i=pM({},i)).nodes&&0!==i.nodes.length||(i.nodes=this.body.nodeIndices),!0===n){var o=0;for(var r in this.body.nodes)if(this.body.nodes.hasOwnProperty(r)){var s=this.body.nodes[r];!0===s.predefinedPosition&&(o+=1);}if(o>.5*this.body.nodeIndices.length)return void this.fit(i,!1);t=hD.getRange(this.body.nodes,i.nodes);var a=this.body.nodeIndices.length;e=12.662/(a+7.4147)+.0964822;var h=Math.min(this.canvas.frame.canvas.clientWidth/600,this.canvas.frame.canvas.clientHeight/600);e*=h;}else{this.body.emitter.emit("_resizeNodes"),t=hD.getRange(this.body.nodes,i.nodes);var l=1.1*Math.abs(t.maxX-t.minX),d=1.1*Math.abs(t.maxY-t.minY),u=this.canvas.frame.canvas.clientWidth/l,c=this.canvas.frame.canvas.clientHeight/d;e=u<=c?u:c;}e>1?e=1:0===e&&(e=1);var f=hD.findCenter(t),p={position:f,scale:e,animation:i.animation};this.moveTo(p);}},{key:"focus",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(void 0!==this.body.nodes[t]){var i={x:this.body.nodes[t].x,y:this.body.nodes[t].y};e.position=i,e.lockedOnNode=t,this.moveTo(e);}else console.log("Node: "+t+" cannot be found.");}},{key:"moveTo",value:function(t){if(void 0!==t){if(null!=t.offset){if(null!=t.offset.x){if(t.offset.x=+t.offset.x,!gD(t.offset.x))throw new TypeError('The option "offset.x" has to be a finite number.')}else t.offset.x=0;if(null!=t.offset.y){if(t.offset.y=+t.offset.y,!gD(t.offset.y))throw new TypeError('The option "offset.y" has to be a finite number.')}else t.offset.x=0;}else t.offset={x:0,y:0};if(null!=t.position){if(null!=t.position.x){if(t.position.x=+t.position.x,!gD(t.position.x))throw new TypeError('The option "position.x" has to be a finite number.')}else t.position.x=0;if(null!=t.position.y){if(t.position.y=+t.position.y,!gD(t.position.y))throw new TypeError('The option "position.y" has to be a finite number.')}else t.position.x=0;}else t.position=this.getViewPosition();if(null!=t.scale){if(t.scale=+t.scale,!(t.scale>0))throw new TypeError('The option "scale" has to be a number greater than zero.')}else t.scale=this.body.view.scale;void 0===t.animation&&(t.animation={duration:0}),!1===t.animation&&(t.animation={duration:0}),!0===t.animation&&(t.animation={}),void 0===t.animation.duration&&(t.animation.duration=1e3),void 0===t.animation.easingFunction&&(t.animation.easingFunction="easeInOutQuad"),this.animateView(t);}else t={};}},{key:"animateView",value:function(t){if(void 0!==t){this.animationEasingFunction=t.animation.easingFunction,this.releaseNode(),!0===t.locked&&(this.lockedOnNodeId=t.lockedOnNode,this.lockedOnNodeOffset=t.offset),0!=this.easingTime&&this._transitionRedraw(!0),this.sourceScale=this.body.view.scale,this.sourceTranslation=this.body.view.translation,this.targetScale=t.scale,this.body.view.scale=this.targetScale;var e,i,n=this.canvas.DOMtoCanvas({x:.5*this.canvas.frame.canvas.clientWidth,y:.5*this.canvas.frame.canvas.clientHeight}),o=n.x-t.position.x,r=n.y-t.position.y;if(this.targetTranslation={x:this.sourceTranslation.x+o*this.targetScale+t.offset.x,y:this.sourceTranslation.y+r*this.targetScale+t.offset.y},0===t.animation.duration)if(null!=this.lockedOnNodeId)this.viewFunction=$(e=this._lockedRedraw).call(e,this),this.body.emitter.on("initRedraw",this.viewFunction);else this.body.view.scale=this.targetScale,this.body.view.translation=this.targetTranslation,this.body.emitter.emit("_requestRedraw");else this.animationSpeed=1/(60*t.animation.duration*.001)||1/60,this.animationEasingFunction=t.animation.easingFunction,this.viewFunction=$(i=this._transitionRedraw).call(i,this),this.body.emitter.on("initRedraw",this.viewFunction),this.body.emitter.emit("_startRendering");}}},{key:"_lockedRedraw",value:function(){var t=this.body.nodes[this.lockedOnNodeId].x,e=this.body.nodes[this.lockedOnNodeId].y,i=this.canvas.DOMtoCanvas({x:.5*this.canvas.frame.canvas.clientWidth,y:.5*this.canvas.frame.canvas.clientHeight}),n=i.x-t,o=i.y-e,r=this.body.view.translation,s={x:r.x+n*this.body.view.scale+this.lockedOnNodeOffset.x,y:r.y+o*this.body.view.scale+this.lockedOnNodeOffset.y};this.body.view.translation=s;}},{key:"releaseNode",value:function(){void 0!==this.lockedOnNodeId&&void 0!==this.viewFunction&&(this.body.emitter.off("initRedraw",this.viewFunction),this.lockedOnNodeId=void 0,this.lockedOnNodeOffset=void 0);}},{key:"_transitionRedraw",value:function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];this.easingTime+=this.animationSpeed,this.easingTime=!0===t?1:this.easingTime;var e=Ys[this.animationEasingFunction](this.easingTime);if(this.body.view.scale=this.sourceScale+(this.targetScale-this.sourceScale)*e,this.body.view.translation={x:this.sourceTranslation.x+(this.targetTranslation.x-this.sourceTranslation.x)*e,y:this.sourceTranslation.y+(this.targetTranslation.y-this.sourceTranslation.y)*e},this.easingTime>=1){var i;if(this.body.emitter.off("initRedraw",this.viewFunction),this.easingTime=0,null!=this.lockedOnNodeId)this.viewFunction=$(i=this._lockedRedraw).call(i,this),this.body.emitter.on("initRedraw",this.viewFunction);this.body.emitter.emit("animationFinished");}}},{key:"getScale",value:function(){return this.body.view.scale}},{key:"getViewPosition",value:function(){return this.canvas.DOMtoCanvas({x:.5*this.canvas.frame.canvas.clientWidth,y:.5*this.canvas.frame.canvas.clientHeight})}}]),t}(),bD=function(){function t(e,i){var n=this;kc(this,t),this.body=e,this.canvas=i,this.iconsCreated=!1,this.navigationHammers=[],this.boundFunctions={},this.touchTime=0,this.activated=!1,this.body.emitter.on("activate",(function(){n.activated=!0,n.configureKeyboardBindings();})),this.body.emitter.on("deactivate",(function(){n.activated=!1,n.configureKeyboardBindings();})),this.body.emitter.on("destroy",(function(){void 0!==n.keycharm&&n.keycharm.destroy();})),this.options={};}return Mc(t,[{key:"setOptions",value:function(t){void 0!==t&&(this.options=t,this.create());}},{key:"create",value:function(){!0===this.options.navigationButtons?!1===this.iconsCreated&&this.loadNavigationElements():!0===this.iconsCreated&&this.cleanNavigation(),this.configureKeyboardBindings();}},{key:"cleanNavigation",value:function(){if(0!=this.navigationHammers.length){for(var t=0;t<this.navigationHammers.length;t++)this.navigationHammers[t].destroy();this.navigationHammers=[];}this.navigationDOM&&this.navigationDOM.wrapper&&this.navigationDOM.wrapper.parentNode&&this.navigationDOM.wrapper.parentNode.removeChild(this.navigationDOM.wrapper),this.iconsCreated=!1;}},{key:"loadNavigationElements",value:function(){var t=this;this.cleanNavigation(),this.navigationDOM={};var e=["up","down","left","right","zoomIn","zoomOut","zoomExtends"],i=["_moveUp","_moveDown","_moveLeft","_moveRight","_zoomIn","_zoomOut","_fit"];this.navigationDOM.wrapper=document.createElement("div"),this.navigationDOM.wrapper.className="vis-navigation",this.canvas.frame.appendChild(this.navigationDOM.wrapper);for(var n=0;n<e.length;n++){this.navigationDOM[e[n]]=document.createElement("div"),this.navigationDOM[e[n]].className="vis-button vis-"+e[n],this.navigationDOM.wrapper.appendChild(this.navigationDOM[e[n]]);var o,r,s=new gc(this.navigationDOM[e[n]]);if("_fit"===i[n])fD.onTouch(s,$(o=this._fit).call(o,this));else fD.onTouch(s,$(r=this.bindToRedraw).call(r,this,i[n]));this.navigationHammers.push(s);}var a=new gc(this.canvas.frame);fD.onRelease(a,(function(){t._stopMovement();})),this.navigationHammers.push(a),this.iconsCreated=!0;}},{key:"bindToRedraw",value:function(t){var e;void 0===this.boundFunctions[t]&&(this.boundFunctions[t]=$(e=this[t]).call(e,this),this.body.emitter.on("initRedraw",this.boundFunctions[t]),this.body.emitter.emit("_startRendering"));}},{key:"unbindFromRedraw",value:function(t){void 0!==this.boundFunctions[t]&&(this.body.emitter.off("initRedraw",this.boundFunctions[t]),this.body.emitter.emit("_stopRendering"),delete this.boundFunctions[t]);}},{key:"_fit",value:function(){(new Date).valueOf()-this.touchTime>700&&(this.body.emitter.emit("fit",{duration:700}),this.touchTime=(new Date).valueOf());}},{key:"_stopMovement",value:function(){for(var t in this.boundFunctions)this.boundFunctions.hasOwnProperty(t)&&(this.body.emitter.off("initRedraw",this.boundFunctions[t]),this.body.emitter.emit("_stopRendering"));this.boundFunctions={};}},{key:"_moveUp",value:function(){this.body.view.translation.y+=this.options.keyboard.speed.y;}},{key:"_moveDown",value:function(){this.body.view.translation.y-=this.options.keyboard.speed.y;}},{key:"_moveLeft",value:function(){this.body.view.translation.x+=this.options.keyboard.speed.x;}},{key:"_moveRight",value:function(){this.body.view.translation.x-=this.options.keyboard.speed.x;}},{key:"_zoomIn",value:function(){var t=this.body.view.scale,e=this.body.view.scale*(1+this.options.keyboard.speed.zoom),i=this.body.view.translation,n=e/t,o=(1-n)*this.canvas.canvasViewCenter.x+i.x*n,r=(1-n)*this.canvas.canvasViewCenter.y+i.y*n;this.body.view.scale=e,this.body.view.translation={x:o,y:r},this.body.emitter.emit("zoom",{direction:"+",scale:this.body.view.scale,pointer:null});}},{key:"_zoomOut",value:function(){var t=this.body.view.scale,e=this.body.view.scale/(1+this.options.keyboard.speed.zoom),i=this.body.view.translation,n=e/t,o=(1-n)*this.canvas.canvasViewCenter.x+i.x*n,r=(1-n)*this.canvas.canvasViewCenter.y+i.y*n;this.body.view.scale=e,this.body.view.translation={x:o,y:r},this.body.emitter.emit("zoom",{direction:"-",scale:this.body.view.scale,pointer:null});}},{key:"configureKeyboardBindings",value:function(){var t,e,i,n,o,r,s,a,h,l,d,u,c,f,p,v,y,g,m,b,w,_,k,x,O=this;(void 0!==this.keycharm&&this.keycharm.destroy(),!0===this.options.keyboard.enabled)&&(!0===this.options.keyboard.bindToWindow?this.keycharm=hd({container:window,preventDefault:!0}):this.keycharm=hd({container:this.canvas.frame,preventDefault:!0}),this.keycharm.reset(),!0===this.activated&&($(t=this.keycharm).call(t,"up",(function(){O.bindToRedraw("_moveUp");}),"keydown"),$(e=this.keycharm).call(e,"down",(function(){O.bindToRedraw("_moveDown");}),"keydown"),$(i=this.keycharm).call(i,"left",(function(){O.bindToRedraw("_moveLeft");}),"keydown"),$(n=this.keycharm).call(n,"right",(function(){O.bindToRedraw("_moveRight");}),"keydown"),$(o=this.keycharm).call(o,"=",(function(){O.bindToRedraw("_zoomIn");}),"keydown"),$(r=this.keycharm).call(r,"num+",(function(){O.bindToRedraw("_zoomIn");}),"keydown"),$(s=this.keycharm).call(s,"num-",(function(){O.bindToRedraw("_zoomOut");}),"keydown"),$(a=this.keycharm).call(a,"-",(function(){O.bindToRedraw("_zoomOut");}),"keydown"),$(h=this.keycharm).call(h,"[",(function(){O.bindToRedraw("_zoomOut");}),"keydown"),$(l=this.keycharm).call(l,"]",(function(){O.bindToRedraw("_zoomIn");}),"keydown"),$(d=this.keycharm).call(d,"pageup",(function(){O.bindToRedraw("_zoomIn");}),"keydown"),$(u=this.keycharm).call(u,"pagedown",(function(){O.bindToRedraw("_zoomOut");}),"keydown"),$(c=this.keycharm).call(c,"up",(function(){O.unbindFromRedraw("_moveUp");}),"keyup"),$(f=this.keycharm).call(f,"down",(function(){O.unbindFromRedraw("_moveDown");}),"keyup"),$(p=this.keycharm).call(p,"left",(function(){O.unbindFromRedraw("_moveLeft");}),"keyup"),$(v=this.keycharm).call(v,"right",(function(){O.unbindFromRedraw("_moveRight");}),"keyup"),$(y=this.keycharm).call(y,"=",(function(){O.unbindFromRedraw("_zoomIn");}),"keyup"),$(g=this.keycharm).call(g,"num+",(function(){O.unbindFromRedraw("_zoomIn");}),"keyup"),$(m=this.keycharm).call(m,"num-",(function(){O.unbindFromRedraw("_zoomOut");}),"keyup"),$(b=this.keycharm).call(b,"-",(function(){O.unbindFromRedraw("_zoomOut");}),"keyup"),$(w=this.keycharm).call(w,"[",(function(){O.unbindFromRedraw("_zoomOut");}),"keyup"),$(_=this.keycharm).call(_,"]",(function(){O.unbindFromRedraw("_zoomIn");}),"keyup"),$(k=this.keycharm).call(k,"pageup",(function(){O.unbindFromRedraw("_zoomIn");}),"keyup"),$(x=this.keycharm).call(x,"pagedown",(function(){O.unbindFromRedraw("_zoomOut");}),"keyup")));}}]),t}(),wD=function(){function t(e,i){kc(this,t),this.container=e,this.overflowMethod=i||"cap",this.x=0,this.y=0,this.padding=5,this.hidden=!1,this.frame=document.createElement("div"),this.frame.className="vis-tooltip",this.container.appendChild(this.frame);}return Mc(t,[{key:"setPosition",value:function(t,e){this.x=LS(t),this.y=LS(e);}},{key:"setText",value:function(t){t instanceof Element?(this.frame.innerHTML="",this.frame.appendChild(t)):this.frame.innerHTML=t;}},{key:"show",value:function(t){if(void 0===t&&(t=!0),!0===t){var e=this.frame.clientHeight,i=this.frame.clientWidth,n=this.frame.parentNode.clientHeight,o=this.frame.parentNode.clientWidth,r=0,s=0;if("flip"==this.overflowMethod){var a=!1,h=!0;this.y-e<this.padding&&(h=!1),this.x+i>o-this.padding&&(a=!0),r=a?this.x-i:this.x,s=h?this.y-e:this.y;}else(s=this.y-e)+e+this.padding>n&&(s=n-e-this.padding),s<this.padding&&(s=this.padding),(r=this.x)+i+this.padding>o&&(r=o-i-this.padding),r<this.padding&&(r=this.padding);this.frame.style.left=r+"px",this.frame.style.top=s+"px",this.frame.style.visibility="visible",this.hidden=!1;}else this.hide();}},{key:"hide",value:function(){this.hidden=!0,this.frame.style.left="0",this.frame.style.top="0",this.frame.style.visibility="hidden";}},{key:"destroy",value:function(){this.frame.parentNode.removeChild(this.frame);}}]),t}(),_D=function(){function t(e,i,n){var o,r,s,a,h,l,d,u,c,f,p,v,y;kc(this,t),this.body=e,this.canvas=i,this.selectionHandler=n,this.navigationHandler=new bD(e,i),this.body.eventListeners.onTap=$(o=this.onTap).call(o,this),this.body.eventListeners.onTouch=$(r=this.onTouch).call(r,this),this.body.eventListeners.onDoubleTap=$(s=this.onDoubleTap).call(s,this),this.body.eventListeners.onHold=$(a=this.onHold).call(a,this),this.body.eventListeners.onDragStart=$(h=this.onDragStart).call(h,this),this.body.eventListeners.onDrag=$(l=this.onDrag).call(l,this),this.body.eventListeners.onDragEnd=$(d=this.onDragEnd).call(d,this),this.body.eventListeners.onMouseWheel=$(u=this.onMouseWheel).call(u,this),this.body.eventListeners.onPinch=$(c=this.onPinch).call(c,this),this.body.eventListeners.onMouseMove=$(f=this.onMouseMove).call(f,this),this.body.eventListeners.onRelease=$(p=this.onRelease).call(p,this),this.body.eventListeners.onContext=$(v=this.onContext).call(v,this),this.touchTime=0,this.drag={},this.pinch={},this.popup=void 0,this.popupObj=void 0,this.popupTimer=void 0,this.body.functions.getPointer=$(y=this.getPointer).call(y,this),this.options={},this.defaultOptions={dragNodes:!0,dragView:!0,hover:!1,keyboard:{enabled:!1,speed:{x:10,y:10,zoom:.02},bindToWindow:!0},navigationButtons:!1,tooltipDelay:300,zoomView:!0,zoomSpeed:1},$r(this.options,this.defaultOptions),this.bindEventListeners();}return Mc(t,[{key:"bindEventListeners",value:function(){var t=this;this.body.emitter.on("destroy",(function(){clearTimeout(t.popupTimer),delete t.body.functions.getPointer;}));}},{key:"setOptions",value:function(t){if(void 0!==t){ts(["hideEdgesOnDrag","hideEdgesOnZoom","hideNodesOnDrag","keyboard","multiselect","selectable","selectConnectedEdges"],this.options,t),Ls(this.options,t,"keyboard"),t.tooltip&&($r(this.options.tooltip,t.tooltip),t.tooltip.color&&(this.options.tooltip.color=Os(t.tooltip.color)));}this.navigationHandler.setOptions(this.options);}},{key:"getPointer",value:function(t){return {x:t.x-ss(this.canvas.frame.canvas),y:t.y-hs(this.canvas.frame.canvas)}}},{key:"onTouch",value:function(t){(new Date).valueOf()-this.touchTime>50&&(this.drag.pointer=this.getPointer(t.center),this.drag.pinched=!1,this.pinch.scale=this.body.view.scale,this.touchTime=(new Date).valueOf());}},{key:"onTap",value:function(t){var e=this.getPointer(t.center),i=this.selectionHandler.options.multiselect&&(t.changedPointers[0].ctrlKey||t.changedPointers[0].metaKey);this.checkSelectionChanges(e,t,i),this.selectionHandler._generateClickEvent("click",t,e);}},{key:"onDoubleTap",value:function(t){var e=this.getPointer(t.center);this.selectionHandler._generateClickEvent("doubleClick",t,e);}},{key:"onHold",value:function(t){var e=this.getPointer(t.center),i=this.selectionHandler.options.multiselect;this.checkSelectionChanges(e,t,i),this.selectionHandler._generateClickEvent("click",t,e),this.selectionHandler._generateClickEvent("hold",t,e);}},{key:"onRelease",value:function(t){if((new Date).valueOf()-this.touchTime>10){var e=this.getPointer(t.center);this.selectionHandler._generateClickEvent("release",t,e),this.touchTime=(new Date).valueOf();}}},{key:"onContext",value:function(t){var e=this.getPointer({x:t.clientX,y:t.clientY});this.selectionHandler._generateClickEvent("oncontext",t,e);}},{key:"checkSelectionChanges",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=this.selectionHandler.getSelection(),o=!1;o=!0===i?this.selectionHandler.selectAdditionalOnPoint(t):this.selectionHandler.selectOnPoint(t);var r=this.selectionHandler.getSelection(),s=this._determineDifference(n,r),a=this._determineDifference(r,n);s.edges.length>0&&(this.selectionHandler._generateClickEvent("deselectEdge",e,t,n),o=!0),s.nodes.length>0&&(this.selectionHandler._generateClickEvent("deselectNode",e,t,n),o=!0),a.nodes.length>0&&(this.selectionHandler._generateClickEvent("selectNode",e,t),o=!0),a.edges.length>0&&(this.selectionHandler._generateClickEvent("selectEdge",e,t),o=!0),!0===o&&this.selectionHandler._generateClickEvent("select",e,t);}},{key:"_determineDifference",value:function(t,e){var i=function(t,e){for(var i=[],n=0;n<t.length;n++){var o=t[n];-1===yl(e).call(e,o)&&i.push(o);}return i};return {nodes:i(t.nodes,e.nodes),edges:i(t.edges,e.edges)}}},{key:"onDragStart",value:function(t){void 0===this.drag.pointer&&this.onTouch(t);var e=this.selectionHandler.getNodeAt(this.drag.pointer);if(this.drag.dragging=!0,this.drag.selection=[],this.drag.translation=$r({},this.body.view.translation),this.drag.nodeId=void 0,void 0!==e&&!0===this.options.dragNodes){this.drag.nodeId=e.id,!1===e.isSelected()&&(this.selectionHandler.unselectAll(),this.selectionHandler.selectObject(e)),this.selectionHandler._generateClickEvent("dragStart",t,this.drag.pointer);var i=this.selectionHandler.selectionObj.nodes;for(var n in i)if(i.hasOwnProperty(n)){var o=i[n],r={id:o.id,node:o,x:o.x,y:o.y,xFixed:o.options.fixed.x,yFixed:o.options.fixed.y};o.options.fixed.x=!0,o.options.fixed.y=!0,this.drag.selection.push(r);}}else this.selectionHandler._generateClickEvent("dragStart",t,this.drag.pointer,void 0,!0);}},{key:"onDrag",value:function(t){var e=this;if(!0!==this.drag.pinched){this.body.emitter.emit("unlockNode");var i=this.getPointer(t.center),n=this.drag.selection;if(n&&n.length&&!0===this.options.dragNodes){this.selectionHandler._generateClickEvent("dragging",t,i);var o=i.x-this.drag.pointer.x,r=i.y-this.drag.pointer.y;zh(n).call(n,(function(t){var i=t.node;!1===t.xFixed&&(i.x=e.canvas._XconvertDOMtoCanvas(e.canvas._XconvertCanvasToDOM(t.x)+o)),!1===t.yFixed&&(i.y=e.canvas._YconvertDOMtoCanvas(e.canvas._YconvertCanvasToDOM(t.y)+r));})),this.body.emitter.emit("startSimulation");}else if(!0===this.options.dragView){if(this.selectionHandler._generateClickEvent("dragging",t,i,void 0,!0),void 0===this.drag.pointer)return void this.onDragStart(t);var s=i.x-this.drag.pointer.x,a=i.y-this.drag.pointer.y;this.body.view.translation={x:this.drag.translation.x+s,y:this.drag.translation.y+a},this.body.emitter.emit("_requestRedraw");}}}},{key:"onDragEnd",value:function(t){this.drag.dragging=!1;var e=this.drag.selection;e&&e.length?(zh(e).call(e,(function(t){t.node.options.fixed.x=t.xFixed,t.node.options.fixed.y=t.yFixed;})),this.selectionHandler._generateClickEvent("dragEnd",t,this.getPointer(t.center)),this.body.emitter.emit("startSimulation")):(this.selectionHandler._generateClickEvent("dragEnd",t,this.getPointer(t.center),void 0,!0),this.body.emitter.emit("_requestRedraw"));}},{key:"onPinch",value:function(t){var e=this.getPointer(t.center);this.drag.pinched=!0,void 0===this.pinch.scale&&(this.pinch.scale=1);var i=this.pinch.scale*t.scale;this.zoom(i,e);}},{key:"zoom",value:function(t,e){if(!0===this.options.zoomView){var i=this.body.view.scale;t<1e-5&&(t=1e-5),t>10&&(t=10);var n=void 0;void 0!==this.drag&&!0===this.drag.dragging&&(n=this.canvas.DOMtoCanvas(this.drag.pointer));var o=this.body.view.translation,r=t/i,s=(1-r)*e.x+o.x*r,a=(1-r)*e.y+o.y*r;if(this.body.view.scale=t,this.body.view.translation={x:s,y:a},null!=n){var h=this.canvas.canvasToDOM(n);this.drag.pointer.x=h.x,this.drag.pointer.y=h.y;}this.body.emitter.emit("_requestRedraw"),i<t?this.body.emitter.emit("zoom",{direction:"+",scale:this.body.view.scale,pointer:e}):this.body.emitter.emit("zoom",{direction:"-",scale:this.body.view.scale,pointer:e});}}},{key:"onMouseWheel",value:function(t){if(!0===this.options.zoomView){if(0!==t.deltaY){var e=this.body.view.scale;e*=1+(t.deltaY<0?1:-1)*(.1*this.options.zoomSpeed);var i=this.getPointer({x:t.clientX,y:t.clientY});this.zoom(e,i);}t.preventDefault();}}},{key:"onMouseMove",value:function(t){var e=this,i=this.getPointer({x:t.clientX,y:t.clientY}),n=!1;void 0!==this.popup&&(!1===this.popup.hidden&&this._checkHidePopup(i),!1===this.popup.hidden&&(n=!0,this.popup.setPosition(i.x+3,i.y-5),this.popup.show())),!1===this.options.keyboard.bindToWindow&&!0===this.options.keyboard.enabled&&this.canvas.frame.focus(),!1===n&&(void 0!==this.popupTimer&&(clearInterval(this.popupTimer),this.popupTimer=void 0),this.drag.dragging||(this.popupTimer=Ic((function(){return e._checkShowPopup(i)}),this.options.tooltipDelay))),!0===this.options.hover&&this.selectionHandler.hoverObject(t,i);}},{key:"_checkShowPopup",value:function(t){var e=this.canvas._XconvertDOMtoCanvas(t.x),i=this.canvas._YconvertDOMtoCanvas(t.y),n={left:e,top:i,right:e,bottom:i},o=void 0===this.popupObj?void 0:this.popupObj.id,r=!1,s="node";if(void 0===this.popupObj){for(var a,h=this.body.nodeIndices,l=this.body.nodes,d=[],u=0;u<h.length;u++)!0===(a=l[h[u]]).isOverlappingWith(n)&&(r=!0,void 0!==a.getTitle()&&d.push(h[u]));d.length>0&&(this.popupObj=l[d[d.length-1]],r=!0);}if(void 0===this.popupObj&&!1===r){for(var c,f=this.body.edgeIndices,p=this.body.edges,v=[],y=0;y<f.length;y++)!0===(c=p[f[y]]).isOverlappingWith(n)&&!0===c.connected&&void 0!==c.getTitle()&&v.push(f[y]);v.length>0&&(this.popupObj=p[v[v.length-1]],s="edge");}void 0!==this.popupObj?this.popupObj.id!==o&&(void 0===this.popup&&(this.popup=new wD(this.canvas.frame)),this.popup.popupTargetType=s,this.popup.popupTargetId=this.popupObj.id,this.popup.setPosition(t.x+3,t.y-5),this.popup.setText(this.popupObj.getTitle()),this.popup.show(),this.body.emitter.emit("showPopup",this.popupObj.id)):void 0!==this.popup&&(this.popup.hide(),this.body.emitter.emit("hidePopup"));}},{key:"_checkHidePopup",value:function(t){var e=this.selectionHandler._pointerToPositionObject(t),i=!1;if("node"===this.popup.popupTargetType){if(void 0!==this.body.nodes[this.popup.popupTargetId]&&!0===(i=this.body.nodes[this.popup.popupTargetId].isOverlappingWith(e))){var n=this.selectionHandler.getNodeAt(t);i=void 0!==n&&n.id===this.popup.popupTargetId;}}else void 0===this.selectionHandler.getNodeAt(t)&&void 0!==this.body.edges[this.popup.popupTargetId]&&(i=this.body.edges[this.popup.popupTargetId].isOverlappingWith(e));!1===i&&(this.popupObj=void 0,this.popup.hide(),this.body.emitter.emit("hidePopup"));}}]),t}(),kD=function(){function t(e,i){var n=this;kc(this,t),this.body=e,this.canvas=i,this.selectionObj={nodes:[],edges:[]},this.hoverObj={nodes:{},edges:{}},this.options={},this.defaultOptions={multiselect:!1,selectable:!0,selectConnectedEdges:!0,hoverConnectedEdges:!0},$r(this.options,this.defaultOptions),this.body.emitter.on("_dataChanged",(function(){n.updateSelection();}));}return Mc(t,[{key:"setOptions",value:function(t){if(void 0!==t){Qr(["multiselect","hoverConnectedEdges","selectable","selectConnectedEdges"],this.options,t);}}},{key:"selectOnPoint",value:function(t){var e=!1;if(!0===this.options.selectable){var i=this.getNodeAt(t)||this.getEdgeAt(t);this.unselectAll(),void 0!==i&&(e=this.selectObject(i)),this.body.emitter.emit("_requestRedraw");}return e}},{key:"selectAdditionalOnPoint",value:function(t){var e=!1;if(!0===this.options.selectable){var i=this.getNodeAt(t)||this.getEdgeAt(t);void 0!==i&&(e=!0,!0===i.isSelected()?this.deselectObject(i):this.selectObject(i),this.body.emitter.emit("_requestRedraw"));}return e}},{key:"_initBaseEvent",value:function(t,e){var i={};return i.pointer={DOM:{x:e.x,y:e.y},canvas:this.canvas.DOMtoCanvas(e)},i.event=t,i}},{key:"_generateClickEvent",value:function(t,e,i,n){var o=arguments.length>4&&void 0!==arguments[4]&&arguments[4],r=this._initBaseEvent(e,i);if(!0===o)r.nodes=[],r.edges=[];else{var s=this.getSelection();r.nodes=s.nodes,r.edges=s.edges;}void 0!==n&&(r.previousSelection=n),"click"==t&&(r.items=this.getClickedItems(i)),void 0!==e.controlEdge&&(r.controlEdge=e.controlEdge),this.body.emitter.emit(t,r);}},{key:"selectObject",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.options.selectConnectedEdges;return void 0!==t&&(t instanceof lE&&!0===e&&this._selectConnectedEdges(t),t.select(),this._addToSelection(t),!0)}},{key:"deselectObject",value:function(t){!0===t.isSelected()&&(t.selected=!1,this._removeFromSelection(t));}},{key:"_getAllNodesOverlappingWith",value:function(t){for(var e=[],i=this.body.nodes,n=0;n<this.body.nodeIndices.length;n++){var o=this.body.nodeIndices[n];i[o].isOverlappingWith(t)&&e.push(o);}return e}},{key:"_pointerToPositionObject",value:function(t){var e=this.canvas.DOMtoCanvas(t);return {left:e.x-1,top:e.y+1,right:e.x+1,bottom:e.y-1}}},{key:"getNodeAt",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=this._pointerToPositionObject(t),n=this._getAllNodesOverlappingWith(i);return n.length>0?!0===e?this.body.nodes[n[n.length-1]]:n[n.length-1]:void 0}},{key:"_getEdgesOverlappingWith",value:function(t,e){for(var i=this.body.edges,n=0;n<this.body.edgeIndices.length;n++){var o=this.body.edgeIndices[n];i[o].isOverlappingWith(t)&&e.push(o);}}},{key:"_getAllEdgesOverlappingWith",value:function(t){var e=[];return this._getEdgesOverlappingWith(t,e),e}},{key:"getEdgeAt",value:function(t){for(var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=this.canvas.DOMtoCanvas(t),n=10,o=null,r=this.body.edges,s=0;s<this.body.edgeIndices.length;s++){var a=this.body.edgeIndices[s],h=r[a];if(h.connected){var l=h.from.x,d=h.from.y,u=h.to.x,c=h.to.y,f=h.edgeType.getDistanceToEdge(l,d,u,c,i.x,i.y);f<n&&(o=a,n=f);}}return null!==o?!0===e?this.body.edges[o]:o:void 0}},{key:"_addToSelection",value:function(t){t instanceof lE?this.selectionObj.nodes[t.id]=t:this.selectionObj.edges[t.id]=t;}},{key:"_addToHover",value:function(t){t instanceof lE?this.hoverObj.nodes[t.id]=t:this.hoverObj.edges[t.id]=t;}},{key:"_removeFromSelection",value:function(t){t instanceof lE?(delete this.selectionObj.nodes[t.id],this._unselectConnectedEdges(t)):delete this.selectionObj.edges[t.id];}},{key:"unselectAll",value:function(){for(var t in this.selectionObj.nodes)this.selectionObj.nodes.hasOwnProperty(t)&&this.selectionObj.nodes[t].unselect();for(var e in this.selectionObj.edges)this.selectionObj.edges.hasOwnProperty(e)&&this.selectionObj.edges[e].unselect();this.selectionObj={nodes:{},edges:{}};}},{key:"_getSelectedNodeCount",value:function(){var t=0;for(var e in this.selectionObj.nodes)this.selectionObj.nodes.hasOwnProperty(e)&&(t+=1);return t}},{key:"_getSelectedNode",value:function(){for(var t in this.selectionObj.nodes)if(this.selectionObj.nodes.hasOwnProperty(t))return this.selectionObj.nodes[t]}},{key:"_getSelectedEdge",value:function(){for(var t in this.selectionObj.edges)if(this.selectionObj.edges.hasOwnProperty(t))return this.selectionObj.edges[t]}},{key:"_getSelectedEdgeCount",value:function(){var t=0;for(var e in this.selectionObj.edges)this.selectionObj.edges.hasOwnProperty(e)&&(t+=1);return t}},{key:"_getSelectedObjectCount",value:function(){var t=0;for(var e in this.selectionObj.nodes)this.selectionObj.nodes.hasOwnProperty(e)&&(t+=1);for(var i in this.selectionObj.edges)this.selectionObj.edges.hasOwnProperty(i)&&(t+=1);return t}},{key:"_selectionIsEmpty",value:function(){for(var t in this.selectionObj.nodes)if(this.selectionObj.nodes.hasOwnProperty(t))return !1;for(var e in this.selectionObj.edges)if(this.selectionObj.edges.hasOwnProperty(e))return !1;return !0}},{key:"_clusterInSelection",value:function(){for(var t in this.selectionObj.nodes)if(this.selectionObj.nodes.hasOwnProperty(t)&&this.selectionObj.nodes[t].clusterSize>1)return !0;return !1}},{key:"_selectConnectedEdges",value:function(t){for(var e=0;e<t.edges.length;e++){var i=t.edges[e];i.select(),this._addToSelection(i);}}},{key:"_hoverConnectedEdges",value:function(t){for(var e=0;e<t.edges.length;e++){var i=t.edges[e];i.hover=!0,this._addToHover(i);}}},{key:"_unselectConnectedEdges",value:function(t){for(var e=0;e<t.edges.length;e++){var i=t.edges[e];i.unselect(),this._removeFromSelection(i);}}},{key:"emitBlurEvent",value:function(t,e,i){var n=this._initBaseEvent(t,e);!0===i.hover&&(i.hover=!1,i instanceof lE?(n.node=i.id,this.body.emitter.emit("blurNode",n)):(n.edge=i.id,this.body.emitter.emit("blurEdge",n)));}},{key:"emitHoverEvent",value:function(t,e,i){var n=this._initBaseEvent(t,e),o=!1;return !1===i.hover&&(i.hover=!0,this._addToHover(i),o=!0,i instanceof lE?(n.node=i.id,this.body.emitter.emit("hoverNode",n)):(n.edge=i.id,this.body.emitter.emit("hoverEdge",n))),o}},{key:"hoverObject",value:function(t,e){var i=this.getNodeAt(e);void 0===i&&(i=this.getEdgeAt(e));var n=!1;for(var o in this.hoverObj.nodes)this.hoverObj.nodes.hasOwnProperty(o)&&(void 0===i||i instanceof lE&&i.id!=o||i instanceof VE)&&(this.emitBlurEvent(t,e,this.hoverObj.nodes[o]),delete this.hoverObj.nodes[o],n=!0);for(var r in this.hoverObj.edges)this.hoverObj.edges.hasOwnProperty(r)&&(!0===n?(this.hoverObj.edges[r].hover=!1,delete this.hoverObj.edges[r]):(void 0===i||i instanceof VE&&i.id!=r||i instanceof lE&&!i.hover)&&(this.emitBlurEvent(t,e,this.hoverObj.edges[r]),delete this.hoverObj.edges[r],n=!0));if(void 0!==i){var s=kS(this.hoverObj.edges).length,a=kS(this.hoverObj.nodes).length;(n||i instanceof VE&&0===s&&0===a||i instanceof lE&&0===s&&0===a)&&(n=this.emitHoverEvent(t,e,i)),i instanceof lE&&!0===this.options.hoverConnectedEdges&&this._hoverConnectedEdges(i);}!0===n&&this.body.emitter.emit("_requestRedraw");}},{key:"getSelection",value:function(){return {nodes:this.getSelectedNodes(),edges:this.getSelectedEdges()}}},{key:"getSelectedNodes",value:function(){var t=[];if(!0===this.options.selectable)for(var e in this.selectionObj.nodes)this.selectionObj.nodes.hasOwnProperty(e)&&t.push(this.selectionObj.nodes[e].id);return t}},{key:"getSelectedEdges",value:function(){var t=[];if(!0===this.options.selectable)for(var e in this.selectionObj.edges)this.selectionObj.edges.hasOwnProperty(e)&&t.push(this.selectionObj.edges[e].id);return t}},{key:"setSelection",value:function(t){var e,i,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(!t||!t.nodes&&!t.edges)throw "Selection must be an object with nodes and/or edges properties";if((n.unselectAll||void 0===n.unselectAll)&&this.unselectAll(),t.nodes)for(e=0;e<t.nodes.length;e++){i=t.nodes[e];var o=this.body.nodes[i];if(!o)throw new RangeError('Node with id "'+i+'" not found');this.selectObject(o,n.highlightEdges);}if(t.edges)for(e=0;e<t.edges.length;e++){i=t.edges[e];var r=this.body.edges[i];if(!r)throw new RangeError('Edge with id "'+i+'" not found');this.selectObject(r);}this.body.emitter.emit("_requestRedraw");}},{key:"selectNodes",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if(!t||void 0===t.length)throw "Selection must be an array with ids";this.setSelection({nodes:t},{highlightEdges:e});}},{key:"selectEdges",value:function(t){if(!t||void 0===t.length)throw "Selection must be an array with ids";this.setSelection({edges:t});}},{key:"updateSelection",value:function(){for(var t in this.selectionObj.nodes)this.selectionObj.nodes.hasOwnProperty(t)&&(this.body.nodes.hasOwnProperty(t)||delete this.selectionObj.nodes[t]);for(var e in this.selectionObj.edges)this.selectionObj.edges.hasOwnProperty(e)&&(this.body.edges.hasOwnProperty(e)||delete this.selectionObj.edges[e]);}},{key:"getClickedItems",value:function(t){for(var e=this.canvas.DOMtoCanvas(t),i=[],n=this.body.nodeIndices,o=this.body.nodes,r=n.length-1;r>=0;r--){var s=o[n[r]].getItemsOnPoint(e);i.push.apply(i,s);}for(var a=this.body.edgeIndices,h=this.body.edges,l=a.length-1;l>=0;l--){var d=h[a[l]].getItemsOnPoint(e);i.push.apply(i,d);}return i}}]),t}(),xD=!r((function(){return Object.isExtensible(Object.preventExtensions({}))})),OD=i((function(t){var e=R.f,i=oa("meta"),n=0,o=Object.isExtensible||function(){return !0},r=function(t){e(t,i,{value:{objectID:"O"+ ++n,weakData:{}}});},s=t.exports={REQUIRED:!1,fastKey:function(t,e){if(!g(t))return "symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!w(t,i)){if(!o(t))return "F";if(!e)return "E";r(t);}return t[i].objectID},getWeakData:function(t,e){if(!w(t,i)){if(!o(t))return !0;if(!e)return !1;r(t);}return t[i].weakData},onFreeze:function(t){return xD&&s.REQUIRED&&o(t)&&!w(t,i)&&r(t),t}};aa[i]=!0;})),SD=(OD.REQUIRED,OD.fastKey,OD.getWeakData,OD.onFreeze,Da("iterator")),MD=Array.prototype,ED=function(t,e,i,n){try{return n?e(z(i)[0],i[1]):e(i)}catch(e){var o=t.return;throw void 0!==o&&z(o.call(t)),e}},DD=i((function(t){var e=function(t,e){this.stopped=t,this.result=e;};(t.exports=function(t,i,n,o,r){var s,a,h,l,d,u,c,f,p=j(i,n,o?2:1);if(r)s=t;else{if("function"!=typeof(a=Rc(t)))throw TypeError("Target is not iterable");if(void 0!==(f=a)&&(Gs.Array===f||MD[SD]===f)){for(h=0,l=ja(t.length);l>h;h++)if((d=o?p(z(c=t[h])[0],c[1]):p(t[h]))&&d instanceof e)return d;return new e(!1)}s=a.call(t);}for(u=s.next;!(c=u.call(s)).done;)if("object"==typeof(d=ED(s,p,c.value,o))&&d&&d instanceof e)return d;return new e(!1)}).stop=function(t){return new e(!0,t)};})),TD=function(t,e,i){if(!(t instanceof e))throw TypeError("Incorrect "+(i?i+" ":"")+"invocation");return t},CD=R.f,PD=Ch.forEach,AD=ga.set,ID=ga.getterFor,FD=function(t,e,i){var n,a=-1!==t.indexOf("Map"),h=-1!==t.indexOf("Weak"),l=a?"set":"add",d=o[t],u=d&&d.prototype,c={};if(s&&"function"==typeof d&&(h||u.forEach&&!r((function(){(new d).entries().next();})))){n=e((function(e,i){AD(TD(e,n,t),{type:t,collection:new d}),null!=i&&DD(i,e[l],e,a);}));var f=ID(t);PD(["add","clear","delete","forEach","get","has","set","keys","values","entries"],(function(t){var e="add"==t||"set"==t;t in u&&(!h||"clear"!=t)&&B(n.prototype,t,(function(i,n){var o=f(this).collection;if(!e&&h&&!g(i))return "get"==t&&void 0;var r=o[t](0===i?0:i,n);return e?this:r}));})),h||CD(n.prototype,"size",{configurable:!0,get:function(){return f(this).collection.size}});}else n=i.getConstructor(e,t,a,l),OD.REQUIRED=!0;return lh(n,t,!1,!0),c[t]=n,W({global:!0,forced:!0},c),h||i.setStrong(n,t,a),n},ND=function(t,e,i){for(var n in e)i&&i.unsafe&&t[n]?t[n]=e[n]:fh(t,n,e[n],i);return t},jD=Da("species"),zD=R.f,LD=OD.fastKey,RD=ga.set,BD=ga.getterFor,YD={getConstructor:function(t,e,i,n){var o=t((function(t,r){TD(t,o,e),RD(t,{type:e,index:th(null),first:void 0,last:void 0,size:0}),s||(t.size=0),null!=r&&DD(r,t[n],t,i);})),r=BD(e),a=function(t,e,i){var n,o,a=r(t),l=h(t,e);return l?l.value=i:(a.last=l={index:o=LD(e,!0),key:e,value:i,previous:n=a.last,next:void 0,removed:!1},a.first||(a.first=l),n&&(n.next=l),s?a.size++:t.size++,"F"!==o&&(a.index[o]=l)),t},h=function(t,e){var i,n=r(t),o=LD(e);if("F"!==o)return n.index[o];for(i=n.first;i;i=i.next)if(i.key==e)return i};return ND(o.prototype,{clear:function(){for(var t=r(this),e=t.index,i=t.first;i;)i.removed=!0,i.previous&&(i.previous=i.previous.next=void 0),delete e[i.index],i=i.next;t.first=t.last=void 0,s?t.size=0:this.size=0;},delete:function(t){var e=r(this),i=h(this,t);if(i){var n=i.next,o=i.previous;delete e.index[i.index],i.removed=!0,o&&(o.next=n),n&&(n.previous=o),e.first==i&&(e.first=n),e.last==i&&(e.last=o),s?e.size--:this.size--;}return !!i},forEach:function(t){for(var e,i=r(this),n=j(t,arguments.length>1?arguments[1]:void 0,3);e=e?e.next:i.first;)for(n(e.value,e.key,this);e&&e.removed;)e=e.previous;},has:function(t){return !!h(this,t)}}),ND(o.prototype,i?{get:function(t){var e=h(this,t);return e&&e.value},set:function(t,e){return a(this,0===t?0:t,e)}}:{add:function(t){return a(this,t=0===t?0:t,t)}}),s&&zD(o.prototype,"size",{get:function(){return r(this).size}}),o},setStrong:function(t,e,i){var n=e+" Iterator",o=BD(e),r=BD(n);mh(t,e,(function(t,e){RD(this,{type:n,target:t,state:o(t),kind:e,last:void 0});}),(function(){for(var t=r(this),e=t.kind,i=t.last;i&&i.removed;)i=i.previous;return t.target&&(t.last=i=i?i.next:t.state.first)?"keys"==e?{value:i.key,done:!1}:"values"==e?{value:i.value,done:!1}:{value:[i.key,i.value],done:!1}:(t.target=void 0,{value:void 0,done:!0})}),i?"entries":"values",!i,!0),function(t){var e=Xa(t),i=R.f;s&&e&&!e[jD]&&i(e,jD,{configurable:!0,get:function(){return this}});}(e);}},HD=(FD("Map",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),YD),F.Map),WD=function(t){return function(e,i,n,o){N(i);var r=ma(e),s=p(r),a=ja(r.length),h=t?a-1:0,l=t?-1:1;if(n<2)for(;;){if(h in s){o=s[h],h+=l;break}if(h+=l,t?h<0:a<=h)throw TypeError("Reduce of empty array with no initial value")}for(;t?h>=0:a>h;h+=l)h in s&&(o=i(o,s[h],h,r));return o}},VD={left:WD(!1),right:WD(!0)}.left;W({target:"Array",proto:!0,forced:Ph("reduce")},{reduce:function(t){return VD(this,t,arguments.length,arguments.length>1?arguments[1]:void 0)}});var UD=X("Array").reduce,GD=Array.prototype,qD=function(t){var e=t.reduce;return t===GD||t instanceof Array&&e===GD.reduce?UD:e},XD=[],ZD=XD.sort,KD=r((function(){XD.sort(void 0);})),$D=r((function(){XD.sort(null);})),JD=Ph("sort");W({target:"Array",proto:!0,forced:KD||!$D||JD},{sort:function(t){return void 0===t?ZD.call(ma(this)):ZD.call(ma(this),N(t))}});var QD,tT=X("Array").sort,eT=Array.prototype,iT=function(t){var e=t.sort;return t===eT||t instanceof Array&&e===eT.sort?tT:e},nT=i((function(t,e){!function(t){t.__esModule=!0,t.sort=function(t,i,n,o){if(!Array.isArray(t))throw new TypeError("Can only sort arrays");i?"function"!=typeof i&&(o=n,n=i,i=s):i=s,n||(n=0),o||(o=t.length);var r=o-n;if(!(r<2)){var l=0;if(r<e)return l=a(t,n,o,i),void h(t,n,o,n+l,i);var d=new u(t,i),c=function(t){for(var i=0;t>=e;)i|=1&t,t>>=1;return t+i}(r);do{if((l=a(t,n,o,i))<c){var f=r;f>c&&(f=c),h(t,n,n+f,n+l,i),l=f;}d.pushRun(n,l),d.mergeRuns(),r-=l,n+=l;}while(0!==r);d.forceMergeRuns();}};var e=32,i=7,n=256,o=[1,10,100,1e3,1e4,1e5,1e6,1e7,1e8,1e9];function r(t){return t<1e5?t<100?t<10?0:1:t<1e4?t<1e3?2:3:4:t<1e7?t<1e6?5:6:t<1e9?t<1e8?7:8:9}function s(t,e){if(t===e)return 0;if(~~t===t&&~~e===e){if(0===t||0===e)return t<e?-1:1;if(t<0||e<0){if(e>=0)return -1;if(t>=0)return 1;t=-t,e=-e;}var i=r(t),n=r(e),s=0;return i<n?(t*=o[n-i-1],e/=10,s=-1):i>n&&(e*=o[i-n-1],t/=10,s=1),t===e?s:t<e?-1:1}var a=String(t),h=String(e);return a===h?0:a<h?-1:1}function a(t,e,i,n){var o=e+1;if(o===i)return 1;if(n(t[o++],t[e])<0){for(;o<i&&n(t[o],t[o-1])<0;)o++;!function(t,e,i){for(i--;e<i;){var n=t[e];t[e++]=t[i],t[i--]=n;}}(t,e,o);}else for(;o<i&&n(t[o],t[o-1])>=0;)o++;return o-e}function h(t,e,i,n,o){for(n===e&&n++;n<i;n++){for(var r=t[n],s=e,a=n;s<a;){var h=s+a>>>1;o(r,t[h])<0?a=h:s=h+1;}var l=n-s;switch(l){case 3:t[s+3]=t[s+2];case 2:t[s+2]=t[s+1];case 1:t[s+1]=t[s];break;default:for(;l>0;)t[s+l]=t[s+l-1],l--;}t[s]=r;}}function l(t,e,i,n,o,r){var s=0,a=0,h=1;if(r(t,e[i+o])>0){for(a=n-o;h<a&&r(t,e[i+o+h])>0;)s=h,(h=1+(h<<1))<=0&&(h=a);h>a&&(h=a),s+=o,h+=o;}else{for(a=o+1;h<a&&r(t,e[i+o-h])<=0;)s=h,(h=1+(h<<1))<=0&&(h=a);h>a&&(h=a);var l=s;s=o-h,h=o-l;}for(s++;s<h;){var d=s+(h-s>>>1);r(t,e[i+d])>0?s=d+1:h=d;}return h}function d(t,e,i,n,o,r){var s=0,a=0,h=1;if(r(t,e[i+o])<0){for(a=o+1;h<a&&r(t,e[i+o-h])<0;)s=h,(h=1+(h<<1))<=0&&(h=a);h>a&&(h=a);var l=s;s=o-h,h=o-l;}else{for(a=n-o;h<a&&r(t,e[i+o+h])>=0;)s=h,(h=1+(h<<1))<=0&&(h=a);h>a&&(h=a),s+=o,h+=o;}for(s++;s<h;){var d=s+(h-s>>>1);r(t,e[i+d])<0?h=d:s=d+1;}return h}var u=function(){function t(e,o){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.array=null,this.compare=null,this.minGallop=i,this.length=0,this.tmpStorageLength=n,this.stackLength=0,this.runStart=null,this.runLength=null,this.stackSize=0,this.array=e,this.compare=o,this.length=e.length,this.length<2*n&&(this.tmpStorageLength=this.length>>>1),this.tmp=new Array(this.tmpStorageLength),this.stackLength=this.length<120?5:this.length<1542?10:this.length<119151?19:40,this.runStart=new Array(this.stackLength),this.runLength=new Array(this.stackLength);}return t.prototype.pushRun=function(t,e){this.runStart[this.stackSize]=t,this.runLength[this.stackSize]=e,this.stackSize+=1;},t.prototype.mergeRuns=function(){for(;this.stackSize>1;){var t=this.stackSize-2;if(t>=1&&this.runLength[t-1]<=this.runLength[t]+this.runLength[t+1]||t>=2&&this.runLength[t-2]<=this.runLength[t]+this.runLength[t-1])this.runLength[t-1]<this.runLength[t+1]&&t--;else if(this.runLength[t]>this.runLength[t+1])break;this.mergeAt(t);}},t.prototype.forceMergeRuns=function(){for(;this.stackSize>1;){var t=this.stackSize-2;t>0&&this.runLength[t-1]<this.runLength[t+1]&&t--,this.mergeAt(t);}},t.prototype.mergeAt=function(t){var e=this.compare,i=this.array,n=this.runStart[t],o=this.runLength[t],r=this.runStart[t+1],s=this.runLength[t+1];this.runLength[t]=o+s,t===this.stackSize-3&&(this.runStart[t+1]=this.runStart[t+2],this.runLength[t+1]=this.runLength[t+2]),this.stackSize--;var a=d(i[r],i,n,o,0,e);n+=a,0!=(o-=a)&&0!==(s=l(i[n+o-1],i,r,s,s-1,e))&&(o<=s?this.mergeLow(n,o,r,s):this.mergeHigh(n,o,r,s));},t.prototype.mergeLow=function(t,e,n,o){var r=this.compare,s=this.array,a=this.tmp,h=0;for(h=0;h<e;h++)a[h]=s[t+h];var u=0,c=n,f=t;if(s[f++]=s[c++],0!=--o)if(1!==e){for(var p=this.minGallop;;){var v=0,y=0,g=!1;do{if(r(s[c],a[u])<0){if(s[f++]=s[c++],y++,v=0,0==--o){g=!0;break}}else if(s[f++]=a[u++],v++,y=0,1==--e){g=!0;break}}while((v|y)<p);if(g)break;do{if(0!==(v=d(s[c],a,u,e,0,r))){for(h=0;h<v;h++)s[f+h]=a[u+h];if(f+=v,u+=v,(e-=v)<=1){g=!0;break}}if(s[f++]=s[c++],0==--o){g=!0;break}if(0!==(y=l(a[u],s,c,o,0,r))){for(h=0;h<y;h++)s[f+h]=s[c+h];if(f+=y,c+=y,0==(o-=y)){g=!0;break}}if(s[f++]=a[u++],1==--e){g=!0;break}p--;}while(v>=i||y>=i);if(g)break;p<0&&(p=0),p+=2;}if(this.minGallop=p,p<1&&(this.minGallop=1),1===e){for(h=0;h<o;h++)s[f+h]=s[c+h];s[f+o]=a[u];}else{if(0===e)throw new Error("mergeLow preconditions were not respected");for(h=0;h<e;h++)s[f+h]=a[u+h];}}else{for(h=0;h<o;h++)s[f+h]=s[c+h];s[f+o]=a[u];}else for(h=0;h<e;h++)s[f+h]=a[u+h];},t.prototype.mergeHigh=function(t,e,n,o){var r=this.compare,s=this.array,a=this.tmp,h=0;for(h=0;h<o;h++)a[h]=s[n+h];var u=t+e-1,c=o-1,f=n+o-1,p=0,v=0;if(s[f--]=s[u--],0!=--e)if(1!==o){for(var y=this.minGallop;;){var g=0,m=0,b=!1;do{if(r(a[c],s[u])<0){if(s[f--]=s[u--],g++,m=0,0==--e){b=!0;break}}else if(s[f--]=a[c--],m++,g=0,1==--o){b=!0;break}}while((g|m)<y);if(b)break;do{if(0!=(g=e-d(a[c],s,t,e,e-1,r))){for(e-=g,v=1+(f-=g),p=1+(u-=g),h=g-1;h>=0;h--)s[v+h]=s[p+h];if(0===e){b=!0;break}}if(s[f--]=a[c--],1==--o){b=!0;break}if(0!=(m=o-l(s[u],a,0,o,o-1,r))){for(o-=m,v=1+(f-=m),p=1+(c-=m),h=0;h<m;h++)s[v+h]=a[p+h];if(o<=1){b=!0;break}}if(s[f--]=s[u--],0==--e){b=!0;break}y--;}while(g>=i||m>=i);if(b)break;y<0&&(y=0),y+=2;}if(this.minGallop=y,y<1&&(this.minGallop=1),1===o){for(v=1+(f-=e),p=1+(u-=e),h=e-1;h>=0;h--)s[v+h]=s[p+h];s[f]=a[c];}else{if(0===o)throw new Error("mergeHigh preconditions were not respected");for(p=f-(o-1),h=0;h<o;h++)s[p+h]=a[h];}}else{for(v=1+(f-=e),p=1+(u-=e),h=e-1;h>=0;h--)s[v+h]=s[p+h];s[f]=a[c];}else for(p=f-(o-1),h=0;h<o;h++)s[p+h]=a[h];},t}();}(e);}));(QD=nT)&&QD.__esModule&&Object.prototype.hasOwnProperty.call(QD,"default")&&QD.default;var oT=nT,rT=oT.sort,sT=function(){function t(){kc(this,t);}return Mc(t,[{key:"abstract",value:function(){throw new Error("Can't instantiate abstract class!")}},{key:"fake_use",value:function(){}},{key:"curveType",value:function(){return this.abstract()}},{key:"getPosition",value:function(t){return this.fake_use(t),this.abstract()}},{key:"setPosition",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:void 0;this.fake_use(t,e,i),this.abstract();}},{key:"getTreeSize",value:function(t){return this.fake_use(t),this.abstract()}},{key:"sort",value:function(t){this.fake_use(t),this.abstract();}},{key:"fix",value:function(t,e){this.fake_use(t,e),this.abstract();}},{key:"shift",value:function(t,e){this.fake_use(t,e),this.abstract();}}]),t}(),aT=function(t){function e(t){var i;return kc(this,e),(i=kM(this,MM(e).call(this))).layout=t,i}return TM(e,sT),Mc(e,[{key:"curveType",value:function(){return "horizontal"}},{key:"getPosition",value:function(t){return t.x}},{key:"setPosition",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:void 0;void 0!==i&&this.layout.hierarchical.addToOrdering(t,i),t.x=e;}},{key:"getTreeSize",value:function(t){var e=this.layout.hierarchical.getTreeSize(this.layout.body.nodes,t);return {min:e.min_x,max:e.max_x}}},{key:"sort",value:function(t){rT(t,(function(t,e){return t.x-e.x}));}},{key:"fix",value:function(t,e){t.y=this.layout.options.hierarchical.levelSeparation*e,t.options.fixed.y=!0;}},{key:"shift",value:function(t,e){this.layout.body.nodes[t].x+=e;}}]),e}(),hT=function(t){function e(t){var i;return kc(this,e),(i=kM(this,MM(e).call(this))).layout=t,i}return TM(e,sT),Mc(e,[{key:"curveType",value:function(){return "vertical"}},{key:"getPosition",value:function(t){return t.y}},{key:"setPosition",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:void 0;void 0!==i&&this.layout.hierarchical.addToOrdering(t,i),t.y=e;}},{key:"getTreeSize",value:function(t){var e=this.layout.hierarchical.getTreeSize(this.layout.body.nodes,t);return {min:e.min_y,max:e.max_y}}},{key:"sort",value:function(t){rT(t,(function(t,e){return t.y-e.y}));}},{key:"fix",value:function(t,e){t.x=this.layout.options.hierarchical.levelSeparation*e,t.options.fixed.x=!0;}},{key:"shift",value:function(t,e){this.layout.body.nodes[t].y+=e;}}]),e}(),lT=Ch.every;W({target:"Array",proto:!0,forced:Ph("every")},{every:function(t){return lT(this,t,arguments.length>1?arguments[1]:void 0)}});var dT=X("Array").every,uT=Array.prototype,cT=function(t){var e=t.every;return t===uT||t instanceof Array&&e===uT.every?dT:e},fT=(FD("Set",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),YD),F.Set);function pT(t,e){var i=new fT;return zh(t).call(t,(function(t){var e;zh(e=t.edges).call(e,(function(t){t.connected&&i.add(t);}));})),zh(i).call(i,(function(t){var i=t.from.id,n=t.to.id;null==e[i]&&(e[i]=0),(null==e[n]||e[i]>=e[n])&&(e[n]=e[i]+1);})),e}function vT(t,e,i,n,o){var r=n.size,s=i+"Id",a="to"===i?1:-1,h=!0,l=!1,d=void 0;try{for(var u,c=function(){var h=US(u.value,2),l=h[0],d=h[1];if(!n.has(l)||!t(d))return "continue";o[l]=0;for(var c=[d],f=0,p=void 0,v=function(){var t,h;if(!n.has(l))return "continue";var d=o[p.id]+a;if(zh(t=zO(h=p.edges).call(h,(function(t){return t.connected&&t.to!==t.from&&t[i]!==p&&n.has(t.toId)&&n.has(t.fromId)}))).call(t,(function(t){var n=t[s],r=o[n];(null==r||e(d,r))&&(o[n]=d,c.push(t[i]));})),f>r)return {v:{v:pT(n,o)}};++f;};p=c.pop();){var y=v();switch(y){case"continue":continue;default:if("object"===QS(y))return y.v}}},f=Bc(n);!(h=(u=f.next()).done);h=!0){var p=c();switch(p){case"continue":continue;default:if("object"===QS(p))return p.v}}}catch(t){l=!0,d=t;}finally{try{h||null==f.return||f.return();}finally{if(l)throw d}}return o}var yT=function(){function t(){kc(this,t),this.childrenReference={},this.parentReference={},this.trees={},this.distributionOrdering={},this.levels={},this.distributionIndex={},this.isTree=!1,this.treeIndex=-1;}return Mc(t,[{key:"addRelation",value:function(t,e){void 0===this.childrenReference[t]&&(this.childrenReference[t]=[]),this.childrenReference[t].push(e),void 0===this.parentReference[e]&&(this.parentReference[e]=[]),this.parentReference[e].push(t);}},{key:"checkIfTree",value:function(){for(var t in this.parentReference)if(this.parentReference[t].length>1)return void(this.isTree=!1);this.isTree=!0;}},{key:"numTrees",value:function(){return this.treeIndex+1}},{key:"setTreeIndex",value:function(t,e){void 0!==e&&void 0===this.trees[t.id]&&(this.trees[t.id]=e,this.treeIndex=Math.max(e,this.treeIndex));}},{key:"ensureLevel",value:function(t){void 0===this.levels[t]&&(this.levels[t]=0);}},{key:"getMaxLevel",value:function(t){var e=this,i={};return function t(n){if(void 0!==i[n])return i[n];var o=e.levels[n];if(e.childrenReference[n]){var r=e.childrenReference[n];if(r.length>0)for(var s=0;s<r.length;s++)o=Math.max(o,t(r[s]));}return i[n]=o,o}(t)}},{key:"levelDownstream",value:function(t,e){void 0===this.levels[e.id]&&(void 0===this.levels[t.id]&&(this.levels[t.id]=0),this.levels[e.id]=this.levels[t.id]+1);}},{key:"setMinLevelToZero",value:function(t){var e=1e9;for(var i in t)t.hasOwnProperty(i)&&void 0!==this.levels[i]&&(e=Math.min(this.levels[i],e));for(var n in t)t.hasOwnProperty(n)&&void 0!==this.levels[n]&&(this.levels[n]-=e);}},{key:"getTreeSize",value:function(t,e){var i=1e9,n=-1e9,o=1e9,r=-1e9;for(var s in this.trees)if(this.trees.hasOwnProperty(s)&&this.trees[s]===e){var a=t[s];i=Math.min(a.x,i),n=Math.max(a.x,n),o=Math.min(a.y,o),r=Math.max(a.y,r);}return {min_x:i,max_x:n,min_y:o,max_y:r}}},{key:"hasSameParent",value:function(t,e){var i=this.parentReference[t.id],n=this.parentReference[e.id];if(void 0===i||void 0===n)return !1;for(var o=0;o<i.length;o++)for(var r=0;r<n.length;r++)if(i[o]==n[r])return !0;return !1}},{key:"inSameSubNetwork",value:function(t,e){return this.trees[t.id]===this.trees[e.id]}},{key:"getLevels",value:function(){return kS(this.distributionOrdering)}},{key:"addToOrdering",value:function(t,e){void 0===this.distributionOrdering[e]&&(this.distributionOrdering[e]=[]);var i=!1,n=this.distributionOrdering[e];for(var o in n)if(n[o]===t){i=!0;break}i||(this.distributionOrdering[e].push(t),this.distributionIndex[t.id]=this.distributionOrdering[e].length-1);}}]),t}(),gT=function(){function t(e){kc(this,t),this.body=e,this.initialRandomSeed=Math.round(1e6*Math.random()),this.randomSeed=this.initialRandomSeed,this.setPhysics=!1,this.options={},this.optionsBackup={physics:{}},this.defaultOptions={randomSeed:void 0,improvedLayout:!0,clusterThreshold:150,hierarchical:{enabled:!1,levelSeparation:150,nodeSpacing:100,treeSpacing:200,blockShifting:!0,edgeMinimization:!0,parentCentralization:!0,direction:"UD",sortMethod:"hubsize"}},$r(this.options,this.defaultOptions),this.bindEventListeners();}return Mc(t,[{key:"bindEventListeners",value:function(){var t=this;this.body.emitter.on("_dataChanged",(function(){t.setupHierarchicalLayout();})),this.body.emitter.on("_dataLoaded",(function(){t.layoutNetwork();})),this.body.emitter.on("_resetHierarchicalLayout",(function(){t.setupHierarchicalLayout();})),this.body.emitter.on("_adjustEdgesForHierarchicalLayout",(function(){if(!0===t.options.hierarchical.enabled){var e=t.direction.curveType();t.body.emitter.emit("_forceDisableDynamicCurves",e,!1);}}));}},{key:"setOptions",value:function(t,e){if(void 0!==t){var i=this.options.hierarchical,n=i.enabled;if(Qr(["randomSeed","improvedLayout","clusterThreshold"],this.options,t),Ls(this.options,t,"hierarchical"),void 0!==t.randomSeed&&(this.initialRandomSeed=t.randomSeed),!0===i.enabled)return !0===n&&this.body.emitter.emit("refresh",!0),"RL"===i.direction||"DU"===i.direction?i.levelSeparation>0&&(i.levelSeparation*=-1):i.levelSeparation<0&&(i.levelSeparation*=-1),this.setDirectionStrategy(),this.body.emitter.emit("_resetHierarchicalLayout"),this.adaptAllOptionsForHierarchicalLayout(e);if(!0===n)return this.body.emitter.emit("refresh"),es(e,this.optionsBackup)}return e}},{key:"adaptAllOptionsForHierarchicalLayout",value:function(t){if(!0===this.options.hierarchical.enabled){var e=this.optionsBackup.physics;void 0===t.physics||!0===t.physics?(t.physics={enabled:void 0===e.enabled||e.enabled,solver:"hierarchicalRepulsion"},e.enabled=void 0===e.enabled||e.enabled,e.solver=e.solver||"barnesHut"):"object"===QS(t.physics)?(e.enabled=void 0===t.physics.enabled||t.physics.enabled,e.solver=t.physics.solver||"barnesHut",t.physics.solver="hierarchicalRepulsion"):!1!==t.physics&&(e.solver="barnesHut",t.physics={solver:"hierarchicalRepulsion"});var i=this.direction.curveType();if(void 0===t.edges)this.optionsBackup.edges={smooth:{enabled:!0,type:"dynamic"}},t.edges={smooth:!1};else if(void 0===t.edges.smooth)this.optionsBackup.edges={smooth:{enabled:!0,type:"dynamic"}},t.edges.smooth=!1;else if("boolean"==typeof t.edges.smooth)this.optionsBackup.edges={smooth:t.edges.smooth},t.edges.smooth={enabled:t.edges.smooth,type:i};else{var n=t.edges.smooth;void 0!==n.type&&"dynamic"!==n.type&&(i=n.type),this.optionsBackup.edges={smooth:void 0===n.enabled||n.enabled,type:void 0===n.type?"dynamic":n.type,roundness:void 0===n.roundness?.5:n.roundness,forceDirection:void 0!==n.forceDirection&&n.forceDirection},t.edges.smooth={enabled:void 0===n.enabled||n.enabled,type:i,roundness:void 0===n.roundness?.5:n.roundness,forceDirection:void 0!==n.forceDirection&&n.forceDirection};}this.body.emitter.emit("_forceDisableDynamicCurves",i);}return t}},{key:"seededRandom",value:function(){var t=1e4*Math.sin(this.randomSeed++);return t-Math.floor(t)}},{key:"positionInitially",value:function(t){if(!0!==this.options.hierarchical.enabled){this.randomSeed=this.initialRandomSeed;for(var e=t.length+50,i=0;i<t.length;i++){var n=t[i],o=2*Math.PI*this.seededRandom();void 0===n.x&&(n.x=e*Math.cos(o)),void 0===n.y&&(n.y=e*Math.sin(o));}}}},{key:"layoutNetwork",value:function(){if(!0!==this.options.hierarchical.enabled&&!0===this.options.improvedLayout){for(var t=this.body.nodeIndices,e=0,i=0;i<t.length;i++){!0===this.body.nodes[t[i]].predefinedPosition&&(e+=1);}if(e<.5*t.length){var n=0,o=this.options.clusterThreshold,r={clusterNodeProperties:{shape:"ellipse",label:"",group:"",font:{multi:!1}},clusterEdgeProperties:{label:"",font:{multi:!1},smooth:{enabled:!1}}};if(t.length>o){for(var s=t.length;t.length>o&&n<=10;){n+=1;var a=t.length;if(n%3==0?this.body.modules.clustering.clusterBridges(r):this.body.modules.clustering.clusterOutliers(r),a==t.length&&n%3!=0)return this._declusterAll(),this.body.emitter.emit("_layoutFailed"),void console.info("This network could not be positioned by this version of the improved layout algorithm. Please disable improvedLayout for better performance.")}this.body.modules.kamadaKawai.setOptions({springLength:Math.max(150,2*s)});}n>10&&console.info("The clustering didn't succeed within the amount of interations allowed, progressing with partial result."),this.body.modules.kamadaKawai.solve(t,this.body.edgeIndices,!0),this._shiftToCenter();for(var h=0;h<t.length;h++){var l=this.body.nodes[t[h]];!1===l.predefinedPosition&&(l.x+=70*(.5-this.seededRandom()),l.y+=70*(.5-this.seededRandom()));}this._declusterAll(),this.body.emitter.emit("_repositionBezierNodes");}}}},{key:"_shiftToCenter",value:function(){for(var t=hD.getRangeCore(this.body.nodes,this.body.nodeIndices),e=hD.findCenter(t),i=0;i<this.body.nodeIndices.length;i++){var n=this.body.nodes[this.body.nodeIndices[i]];n.x-=e.x,n.y-=e.y;}}},{key:"_declusterAll",value:function(){for(var t=!0;!0===t;){t=!1;for(var e=0;e<this.body.nodeIndices.length;e++)!0===this.body.nodes[this.body.nodeIndices[e]].isCluster&&(t=!0,this.body.modules.clustering.openCluster(this.body.nodeIndices[e],{},!1));!0===t&&this.body.emitter.emit("_dataChanged");}}},{key:"getSeed",value:function(){return this.initialRandomSeed}},{key:"setupHierarchicalLayout",value:function(){if(!0===this.options.hierarchical.enabled&&this.body.nodeIndices.length>0){var t,e,i=!1,n=!1;for(e in this.lastNodeOnLevel={},this.hierarchical=new yT,this.body.nodes)this.body.nodes.hasOwnProperty(e)&&(void 0!==(t=this.body.nodes[e]).options.level?(i=!0,this.hierarchical.levels[e]=t.options.level):n=!0);if(!0===n&&!0===i)throw new Error("To use the hierarchical layout, nodes require either no predefined levels or levels have to be defined for all nodes.");if(!0===n){var o=this.options.hierarchical.sortMethod;"hubsize"===o?this._determineLevelsByHubsize():"directed"===o?this._determineLevelsDirected():"custom"===o&&this._determineLevelsCustomCallback();}for(var r in this.body.nodes)this.body.nodes.hasOwnProperty(r)&&this.hierarchical.ensureLevel(r);var s=this._getDistribution();this._generateMap(),this._placeNodesByHierarchy(s),this._condenseHierarchy(),this._shiftToCenter();}}},{key:"_condenseHierarchy",value:function(){var t=this,e=!1,i={},n=function(e,i){var n=t.hierarchical.trees;for(var o in n)n.hasOwnProperty(o)&&n[o]===e&&t.direction.shift(o,i);},o=function(){for(var e=[],i=0;i<t.hierarchical.numTrees();i++)e.push(t.direction.getTreeSize(i));return e},r=function e(i,n){if(!n[i.id]&&(n[i.id]=!0,t.hierarchical.childrenReference[i.id])){var o=t.hierarchical.childrenReference[i.id];if(o.length>0)for(var r=0;r<o.length;r++)e(t.body.nodes[o[r]],n);}},s=function(e){var i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1e9,n=1e9,o=1e9,r=1e9,s=-1e9;for(var a in e)if(e.hasOwnProperty(a)){var h=t.body.nodes[a],l=t.hierarchical.levels[h.id],d=t.direction.getPosition(h),u=t._getSpaceAroundNode(h,e),c=US(u,2),f=c[0],p=c[1];n=Math.min(f,n),o=Math.min(p,o),l<=i&&(r=Math.min(d,r),s=Math.max(d,s));}return [r,s,n,o]},a=function(e,i){var n=t.hierarchical.getMaxLevel(e.id),o=t.hierarchical.getMaxLevel(i.id);return Math.min(n,o)},h=function(e,i,n){for(var o=t.hierarchical,r=0;r<i.length;r++){var s=i[r],a=o.distributionOrdering[s];if(a.length>1)for(var h=0;h<a.length-1;h++){var l=a[h],d=a[h+1];o.hasSameParent(l,d)&&o.inSameSubNetwork(l,d)&&e(l,d,n);}}},l=function(i,n){var o=arguments.length>2&&void 0!==arguments[2]&&arguments[2],h=t.direction.getPosition(i),l=t.direction.getPosition(n),d=Math.abs(l-h),u=t.options.hierarchical.nodeSpacing;if(d>u){var c={},f={};r(i,c),r(n,f);var p=a(i,n),v=s(c,p),y=s(f,p),g=v[1],m=y[0],b=y[2],w=Math.abs(g-m);if(w>u){var _=g-m+u;_<-b+u&&(_=-b+u),_<0&&(t._shiftBlock(n.id,_),e=!0,!0===o&&t._centerParent(n));}}},d=function(n,o){for(var a=o.id,h=o.edges,l=t.hierarchical.levels[o.id],d=t.options.hierarchical.levelSeparation*t.options.hierarchical.levelSeparation,u={},c=[],f=0;f<h.length;f++){var p=h[f];if(p.toId!=p.fromId){var v=p.toId==a?p.from:p.to;u[h[f].id]=v,t.hierarchical.levels[v.id]<l&&c.push(p);}}var y=function(e,i){for(var n=0,o=0;o<i.length;o++)if(void 0!==u[i[o].id]){var r=t.direction.getPosition(u[i[o].id])-e;n+=r/Math.sqrt(r*r+d);}return n},g=function(e,i){for(var n=0,o=0;o<i.length;o++)if(void 0!==u[i[o].id]){var r=t.direction.getPosition(u[i[o].id])-e;n-=d*Math.pow(r*r+d,-1.5);}return n},m=function(e,i){for(var n=t.direction.getPosition(o),r={},s=0;s<e;s++){var a=y(n,i),h=g(n,i);if(void 0!==r[n-=Math.max(-40,Math.min(40,Math.round(a/h)))])break;r[n]=s;}return n},b=m(n,c);!function(n){var a=t.direction.getPosition(o);if(void 0===i[o.id]){var h={};r(o,h),i[o.id]=h;}var l=s(i[o.id]),d=l[2],u=l[3],c=n-a,f=0;c>0?f=Math.min(c,u-t.options.hierarchical.nodeSpacing):c<0&&(f=-Math.min(-c,d-t.options.hierarchical.nodeSpacing)),0!=f&&(t._shiftBlock(o.id,f),e=!0);}(b),function(i){var n=t.direction.getPosition(o),r=t._getSpaceAroundNode(o),s=US(r,2),a=s[0],h=s[1],l=i-n,d=n;l>0?d=Math.min(n+(h-t.options.hierarchical.nodeSpacing),i):l<0&&(d=Math.max(n-(a-t.options.hierarchical.nodeSpacing),i)),d!==n&&(t.direction.setPosition(o,d),e=!0);}(b=m(n,h));};!0===this.options.hierarchical.blockShifting&&(function(i){var n=t.hierarchical.getLevels();n=aD(n).call(n);for(var o=0;o<i&&(e=!1,h(l,n,!0),!0===e);o++);}(5),function(){for(var e in t.body.nodes)t.body.nodes.hasOwnProperty(e)&&t._centerParent(t.body.nodes[e]);}()),!0===this.options.hierarchical.edgeMinimization&&function(i){var n=t.hierarchical.getLevels();n=aD(n).call(n);for(var o=0;o<i;o++){e=!1;for(var r=0;r<n.length;r++)for(var s=n[r],a=t.hierarchical.distributionOrdering[s],h=0;h<a.length;h++)d(1e3,a[h]);if(!0!==e)break}}(20),!0===this.options.hierarchical.parentCentralization&&function(){var e=t.hierarchical.getLevels();e=aD(e).call(e);for(var i=0;i<e.length;i++)for(var n=e[i],o=t.hierarchical.distributionOrdering[n],r=0;r<o.length;r++)t._centerParent(o[r]);}(),function(){for(var e=o(),i=0,r=0;r<e.length-1;r++){i+=e[r].max-e[r+1].min+t.options.hierarchical.treeSpacing,n(r+1,i);}}();}},{key:"_getSpaceAroundNode",value:function(t,e){var i=!0;void 0===e&&(i=!1);var n=this.hierarchical.levels[t.id];if(void 0!==n){var o=this.hierarchical.distributionIndex[t.id],r=this.direction.getPosition(t),s=this.hierarchical.distributionOrdering[n],a=1e9,h=1e9;if(0!==o){var l=s[o-1];if(!0===i&&void 0===e[l.id]||!1===i)a=r-this.direction.getPosition(l);}if(o!=s.length-1){var d=s[o+1];if(!0===i&&void 0===e[d.id]||!1===i){var u=this.direction.getPosition(d);h=Math.min(h,u-r);}}return [a,h]}return [0,0]}},{key:"_centerParent",value:function(t){if(this.hierarchical.parentReference[t.id])for(var e=this.hierarchical.parentReference[t.id],i=0;i<e.length;i++){var n=e[i],o=this.body.nodes[n],r=this.hierarchical.childrenReference[n];if(void 0!==r){var s=this._getCenterPosition(r),a=this.direction.getPosition(o),h=this._getSpaceAroundNode(o),l=US(h,2),d=l[0],u=l[1],c=a-s;(c<0&&Math.abs(c)<u-this.options.hierarchical.nodeSpacing||c>0&&Math.abs(c)<d-this.options.hierarchical.nodeSpacing)&&this.direction.setPosition(o,s);}}}},{key:"_placeNodesByHierarchy",value:function(t){for(var e in this.positionedNodes={},t)if(t.hasOwnProperty(e)){var i,n=kS(t[e]);n=this._indexArrayToNodes(n),iT(i=this.direction).call(i,n);for(var o=0,r=0;r<n.length;r++){var s=n[r];if(void 0===this.positionedNodes[s.id]){var a=this.options.hierarchical.nodeSpacing,h=a*o;o>0&&(h=this.direction.getPosition(n[r-1])+a),this.direction.setPosition(s,h,e),this._validatePositionAndContinue(s,e,h),o++;}}}}},{key:"_placeBranchNodes",value:function(t,e){var i,n=this.hierarchical.childrenReference[t];if(void 0!==n){for(var o=[],r=0;r<n.length;r++)o.push(this.body.nodes[n[r]]);iT(i=this.direction).call(i,o);for(var s=0;s<o.length;s++){var a=o[s],h=this.hierarchical.levels[a.id];if(!(h>e&&void 0===this.positionedNodes[a.id]))return;var l=this.options.hierarchical.nodeSpacing,d=void 0;d=0===s?this.direction.getPosition(this.body.nodes[t]):this.direction.getPosition(o[s-1])+l,this.direction.setPosition(a,d,h),this._validatePositionAndContinue(a,h,d);}var u=this._getCenterPosition(o);this.direction.setPosition(this.body.nodes[t],u,e);}}},{key:"_validatePositionAndContinue",value:function(t,e,i){if(this.hierarchical.isTree){if(void 0!==this.lastNodeOnLevel[e]){var n=this.direction.getPosition(this.body.nodes[this.lastNodeOnLevel[e]]);if(i-n<this.options.hierarchical.nodeSpacing){var o=n+this.options.hierarchical.nodeSpacing-i,r=this._findCommonParent(this.lastNodeOnLevel[e],t.id);this._shiftBlock(r.withChild,o);}}this.lastNodeOnLevel[e]=t.id,this.positionedNodes[t.id]=!0,this._placeBranchNodes(t.id,e);}}},{key:"_indexArrayToNodes",value:function(t){for(var e=[],i=0;i<t.length;i++)e.push(this.body.nodes[t[i]]);return e}},{key:"_getDistribution",value:function(){var t,e,i={};for(t in this.body.nodes)if(this.body.nodes.hasOwnProperty(t)){e=this.body.nodes[t];var n=void 0===this.hierarchical.levels[t]?0:this.hierarchical.levels[t];this.direction.fix(e,n),void 0===i[n]&&(i[n]={}),i[n][t]=e;}return i}},{key:"_getActiveEdges",value:function(t){var e=this,i=[];return us(t.edges,(function(t){var n;-1!==yl(n=e.body.edgeIndices).call(n,t.id)&&i.push(t);})),i}},{key:"_getHubSizes",value:function(){var t=this,e={};us(this.body.nodeIndices,(function(i){var n=t.body.nodes[i],o=t._getActiveEdges(n).length;e[o]=!0;}));var i=[];return us(e,(function(t){i.push(Number(t));})),iT(oT).call(oT,i,(function(t,e){return e-t})),i}},{key:"_determineLevelsByHubsize",value:function(){for(var t=this,e=function(e,i){t.hierarchical.levelDownstream(e,i);},i=this._getHubSizes(),n=function(n){var o=i[n];if(0===o)return "break";us(t.body.nodeIndices,(function(i){var n=t.body.nodes[i];o===t._getActiveEdges(n).length&&t._crawlNetwork(e,i);}));},o=0;o<i.length;++o){if("break"===n(o))break}}},{key:"_determineLevelsCustomCallback",value:function(){var t=this;this._crawlNetwork((function(e,i,n){var o=t.hierarchical.levels[e.id];void 0===o&&(o=t.hierarchical.levels[e.id]=1e5);var r=(hD.cloneOptions(e,"node"),hD.cloneOptions(i,"node"),void hD.cloneOptions(n,"edge"));t.hierarchical.levels[i.id]=o+r;})),this.hierarchical.setMinLevelToZero(this.body.nodes);}},{key:"_determineLevelsDirected",value:function(){var t,e=this,i=qD(t=this.body.nodeIndices).call(t,(function(t,i){return t.set(i,e.body.nodes[i]),t}),new HD),n=this.hierarchical.levels;"roots"===this.options.hierarchical.shakeTowards?this.hierarchical.levels=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:bl(null);return vT((function(e){var i,n;return cT(i=zO(n=e.edges).call(n,(function(e){return t.has(e.toId)}))).call(i,(function(t){return t.from===e}))}),(function(t,e){return e<t}),"to",t,e)}(i,n):this.hierarchical.levels=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:bl(null);return vT((function(e){var i,n;return cT(i=zO(n=e.edges).call(n,(function(e){return t.has(e.toId)}))).call(i,(function(t){return t.to===e}))}),(function(t,e){return e>t}),"from",t,e)}(i,n),this.hierarchical.setMinLevelToZero(this.body.nodes);}},{key:"_generateMap",value:function(){var t=this;this._crawlNetwork((function(e,i){t.hierarchical.levels[i.id]>t.hierarchical.levels[e.id]&&t.hierarchical.addRelation(e.id,i.id);})),this.hierarchical.checkIfTree();}},{key:"_crawlNetwork",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:function(){},i=arguments.length>1?arguments[1]:void 0,n={},o=function i(o,r){if(void 0===n[o.id]){var s;t.hierarchical.setTreeIndex(o,r),n[o.id]=!0;for(var a=t._getActiveEdges(o),h=0;h<a.length;h++){var l=a[h];!0===l.connected&&(s=l.toId==o.id?l.from:l.to,o.id!=s.id&&(e(o,s,l),i(s,r)));}}};if(void 0===i)for(var r=0,s=0;s<this.body.nodeIndices.length;s++){var a=this.body.nodeIndices[s];if(void 0===n[a]){var h=this.body.nodes[a];o(h,r),r+=1;}}else{var l=this.body.nodes[i];if(void 0===l)return void console.error("Node not found:",i);o(l);}}},{key:"_shiftBlock",value:function(t,e){var i=this,n={};!function t(o){if(!n[o]){n[o]=!0,i.direction.shift(o,e);var r=i.hierarchical.childrenReference[o];if(void 0!==r)for(var s=0;s<r.length;s++)t(r[s]);}}(t);}},{key:"_findCommonParent",value:function(t,e){var i=this,n={};return function t(e,n){var o=i.hierarchical.parentReference[n];if(void 0!==o)for(var r=0;r<o.length;r++){var s=o[r];e[s]=!0,t(e,s);}}(n,t),function t(e,n){var o=i.hierarchical.parentReference[n];if(void 0!==o)for(var r=0;r<o.length;r++){var s=o[r];if(void 0!==e[s])return {foundParent:s,withChild:n};var a=t(e,s);if(null!==a.foundParent)return a}return {foundParent:null,withChild:n}}(n,e)}},{key:"setDirectionStrategy",value:function(){var t="UD"===this.options.hierarchical.direction||"DU"===this.options.hierarchical.direction;this.direction=t?new aT(this):new hT(this);}},{key:"_getCenterPosition",value:function(t){for(var e=1e9,i=-1e9,n=0;n<t.length;n++){var o=void 0;if(void 0!==t[n].id)o=t[n];else{var r=t[n];o=this.body.nodes[r];}var s=this.direction.getPosition(o);e=Math.min(e,s),i=Math.max(i,s);}return .5*(e+i)}}]),t}(),mT=function(){function t(e,i,n,o){var r,s,a=this;kc(this,t),this.body=e,this.canvas=i,this.selectionHandler=n,this.interactionHandler=o,this.editMode=!1,this.manipulationDiv=void 0,this.editModeDiv=void 0,this.closeDiv=void 0,this.manipulationHammers=[],this.temporaryUIFunctions={},this.temporaryEventFunctions=[],this.touchTime=0,this.temporaryIds={nodes:[],edges:[]},this.guiEnabled=!1,this.inMode=!1,this.selectedControlNode=void 0,this.options={},this.defaultOptions={enabled:!1,initiallyActive:!1,addNode:!0,addEdge:!0,editNode:void 0,editEdge:!0,deleteNode:!0,deleteEdge:!0,controlNodeStyle:{shape:"dot",size:6,color:{background:"#ff0000",border:"#3c3c3c",highlight:{background:"#07f968",border:"#3c3c3c"}},borderWidth:2,borderWidthSelected:2}},$r(this.options,this.defaultOptions),this.body.emitter.on("destroy",(function(){a._clean();})),this.body.emitter.on("_dataChanged",$(r=this._restore).call(r,this)),this.body.emitter.on("_resetData",$(s=this._restore).call(s,this));}return Mc(t,[{key:"_restore",value:function(){!1!==this.inMode&&(!0===this.options.initiallyActive?this.enableEditMode():this.disableEditMode());}},{key:"setOptions",value:function(t,e,i){void 0!==e&&(void 0!==e.locale?this.options.locale=e.locale:this.options.locale=i.locale,void 0!==e.locales?this.options.locales=e.locales:this.options.locales=i.locales),void 0!==t&&("boolean"==typeof t?this.options.enabled=t:(this.options.enabled=!0,es(this.options,t)),!0===this.options.initiallyActive&&(this.editMode=!0),this._setup());}},{key:"toggleEditMode",value:function(){!0===this.editMode?this.disableEditMode():this.enableEditMode();}},{key:"enableEditMode",value:function(){this.editMode=!0,this._clean(),!0===this.guiEnabled&&(this.manipulationDiv.style.display="block",this.closeDiv.style.display="block",this.editModeDiv.style.display="none",this.showManipulatorToolbar());}},{key:"disableEditMode",value:function(){this.editMode=!1,this._clean(),!0===this.guiEnabled&&(this.manipulationDiv.style.display="none",this.closeDiv.style.display="none",this.editModeDiv.style.display="block",this._createEditButton());}},{key:"showManipulatorToolbar",value:function(){if(this._clean(),this.manipulationDOM={},!0===this.guiEnabled){var t,e;this.editMode=!0,this.manipulationDiv.style.display="block",this.closeDiv.style.display="block";var i=this.selectionHandler._getSelectedNodeCount(),n=this.selectionHandler._getSelectedEdgeCount(),o=i+n,r=this.options.locales[this.options.locale],s=!1;!1!==this.options.addNode&&(this._createAddNodeButton(r),s=!0),!1!==this.options.addEdge&&(!0===s?this._createSeperator(1):s=!0,this._createAddEdgeButton(r)),1===i&&"function"==typeof this.options.editNode?(!0===s?this._createSeperator(2):s=!0,this._createEditNodeButton(r)):1===n&&0===i&&!1!==this.options.editEdge&&(!0===s?this._createSeperator(3):s=!0,this._createEditEdgeButton(r)),0!==o&&(i>0&&!1!==this.options.deleteNode?(!0===s&&this._createSeperator(4),this._createDeleteButton(r)):0===i&&!1!==this.options.deleteEdge&&(!0===s&&this._createSeperator(4),this._createDeleteButton(r))),this._bindHammerToDiv(this.closeDiv,$(t=this.toggleEditMode).call(t,this)),this._temporaryBindEvent("select",$(e=this.showManipulatorToolbar).call(e,this));}this.body.emitter.emit("_redraw");}},{key:"addNodeMode",value:function(){var t;if(!0!==this.editMode&&this.enableEditMode(),this._clean(),this.inMode="addNode",!0===this.guiEnabled){var e,i=this.options.locales[this.options.locale];this.manipulationDOM={},this._createBackButton(i),this._createSeperator(),this._createDescription(i.addDescription||this.options.locales.en.addDescription),this._bindHammerToDiv(this.closeDiv,$(e=this.toggleEditMode).call(e,this));}this._temporaryBindEvent("click",$(t=this._performAddNode).call(t,this));}},{key:"editNode",value:function(){var t=this;!0!==this.editMode&&this.enableEditMode(),this._clean();var e=this.selectionHandler._getSelectedNode();if(void 0!==e){if(this.inMode="editNode","function"!=typeof this.options.editNode)throw new Error("No function has been configured to handle the editing of nodes.");if(!0!==e.isCluster){var i=es({},e.options,!1);if(i.x=e.x,i.y=e.y,2!==this.options.editNode.length)throw new Error("The function for edit does not support two arguments (data, callback)");this.options.editNode(i,(function(e){null!=e&&"editNode"===t.inMode&&t.body.data.nodes.getDataSet().update(e),t.showManipulatorToolbar();}));}else alert(this.options.locales[this.options.locale].editClusterError||this.options.locales.en.editClusterError);}else this.showManipulatorToolbar();}},{key:"addEdgeMode",value:function(){var t,e,i,n,o;if(!0!==this.editMode&&this.enableEditMode(),this._clean(),this.inMode="addEdge",!0===this.guiEnabled){var r,s=this.options.locales[this.options.locale];this.manipulationDOM={},this._createBackButton(s),this._createSeperator(),this._createDescription(s.edgeDescription||this.options.locales.en.edgeDescription),this._bindHammerToDiv(this.closeDiv,$(r=this.toggleEditMode).call(r,this));}this._temporaryBindUI("onTouch",$(t=this._handleConnect).call(t,this)),this._temporaryBindUI("onDragEnd",$(e=this._finishConnect).call(e,this)),this._temporaryBindUI("onDrag",$(i=this._dragControlNode).call(i,this)),this._temporaryBindUI("onRelease",$(n=this._finishConnect).call(n,this)),this._temporaryBindUI("onDragStart",$(o=this._dragStartEdge).call(o,this)),this._temporaryBindUI("onHold",(function(){}));}},{key:"editEdgeMode",value:function(){if(!0!==this.editMode&&this.enableEditMode(),this._clean(),this.inMode="editEdge","object"!==QS(this.options.editEdge)||"function"!=typeof this.options.editEdge.editWithoutDrag||(this.edgeBeingEditedId=this.selectionHandler.getSelectedEdges()[0],void 0===this.edgeBeingEditedId)){if(!0===this.guiEnabled){var t,e=this.options.locales[this.options.locale];this.manipulationDOM={},this._createBackButton(e),this._createSeperator(),this._createDescription(e.editEdgeDescription||this.options.locales.en.editEdgeDescription),this._bindHammerToDiv(this.closeDiv,$(t=this.toggleEditMode).call(t,this));}if(this.edgeBeingEditedId=this.selectionHandler.getSelectedEdges()[0],void 0!==this.edgeBeingEditedId){var i,n,o,r,s=this.body.edges[this.edgeBeingEditedId],a=this._getNewTargetNode(s.from.x,s.from.y),h=this._getNewTargetNode(s.to.x,s.to.y);this.temporaryIds.nodes.push(a.id),this.temporaryIds.nodes.push(h.id),this.body.nodes[a.id]=a,this.body.nodeIndices.push(a.id),this.body.nodes[h.id]=h,this.body.nodeIndices.push(h.id),this._temporaryBindUI("onTouch",$(i=this._controlNodeTouch).call(i,this)),this._temporaryBindUI("onTap",(function(){})),this._temporaryBindUI("onHold",(function(){})),this._temporaryBindUI("onDragStart",$(n=this._controlNodeDragStart).call(n,this)),this._temporaryBindUI("onDrag",$(o=this._controlNodeDrag).call(o,this)),this._temporaryBindUI("onDragEnd",$(r=this._controlNodeDragEnd).call(r,this)),this._temporaryBindUI("onMouseMove",(function(){})),this._temporaryBindEvent("beforeDrawing",(function(t){var e=s.edgeType.findBorderPositions(t);!1===a.selected&&(a.x=e.from.x,a.y=e.from.y),!1===h.selected&&(h.x=e.to.x,h.y=e.to.y);})),this.body.emitter.emit("_redraw");}else this.showManipulatorToolbar();}else{var l=this.body.edges[this.edgeBeingEditedId];this._performEditEdge(l.from.id,l.to.id);}}},{key:"deleteSelected",value:function(){var t=this;!0!==this.editMode&&this.enableEditMode(),this._clean(),this.inMode="delete";var e=this.selectionHandler.getSelectedNodes(),i=this.selectionHandler.getSelectedEdges(),n=void 0;if(e.length>0){for(var o=0;o<e.length;o++)if(!0===this.body.nodes[e[o]].isCluster)return void alert(this.options.locales[this.options.locale].deleteClusterError||this.options.locales.en.deleteClusterError);"function"==typeof this.options.deleteNode&&(n=this.options.deleteNode);}else i.length>0&&"function"==typeof this.options.deleteEdge&&(n=this.options.deleteEdge);if("function"==typeof n){var r={nodes:e,edges:i};if(2!==n.length)throw new Error("The function for delete does not support two arguments (data, callback)");n(r,(function(e){null!=e&&"delete"===t.inMode?(t.body.data.edges.getDataSet().remove(e.edges),t.body.data.nodes.getDataSet().remove(e.nodes),t.body.emitter.emit("startSimulation"),t.showManipulatorToolbar()):(t.body.emitter.emit("startSimulation"),t.showManipulatorToolbar());}));}else this.body.data.edges.getDataSet().remove(i),this.body.data.nodes.getDataSet().remove(e),this.body.emitter.emit("startSimulation"),this.showManipulatorToolbar();}},{key:"_setup",value:function(){!0===this.options.enabled?(this.guiEnabled=!0,this._createWrappers(),!1===this.editMode?this._createEditButton():this.showManipulatorToolbar()):(this._removeManipulationDOM(),this.guiEnabled=!1);}},{key:"_createWrappers",value:function(){void 0===this.manipulationDiv&&(this.manipulationDiv=document.createElement("div"),this.manipulationDiv.className="vis-manipulation",!0===this.editMode?this.manipulationDiv.style.display="block":this.manipulationDiv.style.display="none",this.canvas.frame.appendChild(this.manipulationDiv)),void 0===this.editModeDiv&&(this.editModeDiv=document.createElement("div"),this.editModeDiv.className="vis-edit-mode",!0===this.editMode?this.editModeDiv.style.display="none":this.editModeDiv.style.display="block",this.canvas.frame.appendChild(this.editModeDiv)),void 0===this.closeDiv&&(this.closeDiv=document.createElement("div"),this.closeDiv.className="vis-close",this.closeDiv.style.display=this.manipulationDiv.style.display,this.canvas.frame.appendChild(this.closeDiv));}},{key:"_getNewTargetNode",value:function(t,e){var i=es({},this.options.controlNodeStyle);i.id="targetNode"+zr(),i.hidden=!1,i.physics=!1,i.x=t,i.y=e;var n=this.body.functions.createNode(i);return n.shape.boundingBox={left:t,right:t,top:e,bottom:e},n}},{key:"_createEditButton",value:function(){var t;this._clean(),this.manipulationDOM={},Ur(this.editModeDiv);var e=this.options.locales[this.options.locale],i=this._createButton("editMode","vis-button vis-edit vis-edit-mode",e.edit||this.options.locales.en.edit);this.editModeDiv.appendChild(i),this._bindHammerToDiv(i,$(t=this.toggleEditMode).call(t,this));}},{key:"_clean",value:function(){this.inMode=!1,!0===this.guiEnabled&&(Ur(this.editModeDiv),Ur(this.manipulationDiv),this._cleanManipulatorHammers()),this._cleanupTemporaryNodesAndEdges(),this._unbindTemporaryUIs(),this._unbindTemporaryEvents(),this.body.emitter.emit("restorePhysics");}},{key:"_cleanManipulatorHammers",value:function(){if(0!=this.manipulationHammers.length){for(var t=0;t<this.manipulationHammers.length;t++)this.manipulationHammers[t].destroy();this.manipulationHammers=[];}}},{key:"_removeManipulationDOM",value:function(){this._clean(),Ur(this.manipulationDiv),Ur(this.editModeDiv),Ur(this.closeDiv),this.manipulationDiv&&this.canvas.frame.removeChild(this.manipulationDiv),this.editModeDiv&&this.canvas.frame.removeChild(this.editModeDiv),this.closeDiv&&this.canvas.frame.removeChild(this.closeDiv),this.manipulationDiv=void 0,this.editModeDiv=void 0,this.closeDiv=void 0;}},{key:"_createSeperator",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1;this.manipulationDOM["seperatorLineDiv"+t]=document.createElement("div"),this.manipulationDOM["seperatorLineDiv"+t].className="vis-separator-line",this.manipulationDiv.appendChild(this.manipulationDOM["seperatorLineDiv"+t]);}},{key:"_createAddNodeButton",value:function(t){var e,i=this._createButton("addNode","vis-button vis-add",t.addNode||this.options.locales.en.addNode);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,$(e=this.addNodeMode).call(e,this));}},{key:"_createAddEdgeButton",value:function(t){var e,i=this._createButton("addEdge","vis-button vis-connect",t.addEdge||this.options.locales.en.addEdge);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,$(e=this.addEdgeMode).call(e,this));}},{key:"_createEditNodeButton",value:function(t){var e,i=this._createButton("editNode","vis-button vis-edit",t.editNode||this.options.locales.en.editNode);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,$(e=this.editNode).call(e,this));}},{key:"_createEditEdgeButton",value:function(t){var e,i=this._createButton("editEdge","vis-button vis-edit",t.editEdge||this.options.locales.en.editEdge);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,$(e=this.editEdgeMode).call(e,this));}},{key:"_createDeleteButton",value:function(t){var e,i;i=this.options.rtl?"vis-button vis-delete-rtl":"vis-button vis-delete";var n=this._createButton("delete",i,t.del||this.options.locales.en.del);this.manipulationDiv.appendChild(n),this._bindHammerToDiv(n,$(e=this.deleteSelected).call(e,this));}},{key:"_createBackButton",value:function(t){var e,i=this._createButton("back","vis-button vis-back",t.back||this.options.locales.en.back);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,$(e=this.showManipulatorToolbar).call(e,this));}},{key:"_createButton",value:function(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"vis-label";return this.manipulationDOM[t+"Div"]=document.createElement("div"),this.manipulationDOM[t+"Div"].className=e,this.manipulationDOM[t+"Label"]=document.createElement("div"),this.manipulationDOM[t+"Label"].className=n,this.manipulationDOM[t+"Label"].innerHTML=i,this.manipulationDOM[t+"Div"].appendChild(this.manipulationDOM[t+"Label"]),this.manipulationDOM[t+"Div"]}},{key:"_createDescription",value:function(t){this.manipulationDiv.appendChild(this._createButton("description","vis-button vis-none",t));}},{key:"_temporaryBindEvent",value:function(t,e){this.temporaryEventFunctions.push({event:t,boundFunction:e}),this.body.emitter.on(t,e);}},{key:"_temporaryBindUI",value:function(t,e){if(void 0===this.body.eventListeners[t])throw new Error("This UI function does not exist. Typo? You tried: "+t+" possible are: "+oE(kS(this.body.eventListeners)));this.temporaryUIFunctions[t]=this.body.eventListeners[t],this.body.eventListeners[t]=e;}},{key:"_unbindTemporaryUIs",value:function(){for(var t in this.temporaryUIFunctions)this.temporaryUIFunctions.hasOwnProperty(t)&&(this.body.eventListeners[t]=this.temporaryUIFunctions[t],delete this.temporaryUIFunctions[t]);this.temporaryUIFunctions={};}},{key:"_unbindTemporaryEvents",value:function(){for(var t=0;t<this.temporaryEventFunctions.length;t++){var e=this.temporaryEventFunctions[t].event,i=this.temporaryEventFunctions[t].boundFunction;this.body.emitter.off(e,i);}this.temporaryEventFunctions=[];}},{key:"_bindHammerToDiv",value:function(t,e){var i=new gc(t,{});fD.onTouch(i,e),this.manipulationHammers.push(i);}},{key:"_cleanupTemporaryNodesAndEdges",value:function(){for(var t=0;t<this.temporaryIds.edges.length;t++){var e;this.body.edges[this.temporaryIds.edges[t]].disconnect(),delete this.body.edges[this.temporaryIds.edges[t]];var i,n=yl(e=this.body.edgeIndices).call(e,this.temporaryIds.edges[t]);if(-1!==n)tl(i=this.body.edgeIndices).call(i,n,1);}for(var o=0;o<this.temporaryIds.nodes.length;o++){var r;delete this.body.nodes[this.temporaryIds.nodes[o]];var s,a=yl(r=this.body.nodeIndices).call(r,this.temporaryIds.nodes[o]);if(-1!==a)tl(s=this.body.nodeIndices).call(s,a,1);}this.temporaryIds={nodes:[],edges:[]};}},{key:"_controlNodeTouch",value:function(t){this.selectionHandler.unselectAll(),this.lastTouch=this.body.functions.getPointer(t.center),this.lastTouch.translation=$r({},this.body.view.translation);}},{key:"_controlNodeDragStart",value:function(t){var e=this.lastTouch,i=this.selectionHandler._pointerToPositionObject(e),n=this.body.nodes[this.temporaryIds.nodes[0]],o=this.body.nodes[this.temporaryIds.nodes[1]],r=this.body.edges[this.edgeBeingEditedId];this.selectedControlNode=void 0;var s=n.isOverlappingWith(i),a=o.isOverlappingWith(i);!0===s?(this.selectedControlNode=n,r.edgeType.from=n):!0===a&&(this.selectedControlNode=o,r.edgeType.to=o),void 0!==this.selectedControlNode&&this.selectionHandler.selectObject(this.selectedControlNode),this.body.emitter.emit("_redraw");}},{key:"_controlNodeDrag",value:function(t){this.body.emitter.emit("disablePhysics");var e=this.body.functions.getPointer(t.center),i=this.canvas.DOMtoCanvas(e);void 0!==this.selectedControlNode?(this.selectedControlNode.x=i.x,this.selectedControlNode.y=i.y):this.interactionHandler.onDrag(t),this.body.emitter.emit("_redraw");}},{key:"_controlNodeDragEnd",value:function(t){var e=this.body.functions.getPointer(t.center),i=this.selectionHandler._pointerToPositionObject(e),n=this.body.edges[this.edgeBeingEditedId];if(void 0!==this.selectedControlNode){this.selectionHandler.unselectAll();for(var o=this.selectionHandler._getAllNodesOverlappingWith(i),r=void 0,s=o.length-1;s>=0;s--)if(o[s]!==this.selectedControlNode.id){r=this.body.nodes[o[s]];break}if(void 0!==r&&void 0!==this.selectedControlNode)if(!0===r.isCluster)alert(this.options.locales[this.options.locale].createEdgeError||this.options.locales.en.createEdgeError);else{var a=this.body.nodes[this.temporaryIds.nodes[0]];this.selectedControlNode.id===a.id?this._performEditEdge(r.id,n.to.id):this._performEditEdge(n.from.id,r.id);}else n.updateEdgeType(),this.body.emitter.emit("restorePhysics");this.body.emitter.emit("_redraw");}}},{key:"_handleConnect",value:function(t){if((new Date).valueOf()-this.touchTime>100){this.lastTouch=this.body.functions.getPointer(t.center),this.lastTouch.translation=$r({},this.body.view.translation);var e=this.lastTouch,i=this.selectionHandler.getNodeAt(e);if(void 0!==i)if(!0===i.isCluster)alert(this.options.locales[this.options.locale].createEdgeError||this.options.locales.en.createEdgeError);else{var n=this._getNewTargetNode(i.x,i.y);this.body.nodes[n.id]=n,this.body.nodeIndices.push(n.id);var o=this.body.functions.createEdge({id:"connectionEdge"+zr(),from:i.id,to:n.id,physics:!1,smooth:{enabled:!0,type:"continuous",roundness:.5}});this.body.edges[o.id]=o,this.body.edgeIndices.push(o.id),this.temporaryIds.nodes.push(n.id),this.temporaryIds.edges.push(o.id);}this.touchTime=(new Date).valueOf();}}},{key:"_dragControlNode",value:function(t){var e=this.body.functions.getPointer(t.center),i=this.selectionHandler._pointerToPositionObject(e),n=void 0;void 0!==this.temporaryIds.edges[0]&&(n=this.body.edges[this.temporaryIds.edges[0]].fromId);for(var o=this.selectionHandler._getAllNodesOverlappingWith(i),r=void 0,s=o.length-1;s>=0;s--){var a;if(-1===yl(a=this.temporaryIds.nodes).call(a,o[s])){r=this.body.nodes[o[s]];break}}if(t.controlEdge={from:n,to:r?r.id:void 0},this.selectionHandler._generateClickEvent("controlNodeDragging",t,e),void 0!==this.temporaryIds.nodes[0]){var h=this.body.nodes[this.temporaryIds.nodes[0]];h.x=this.canvas._XconvertDOMtoCanvas(e.x),h.y=this.canvas._YconvertDOMtoCanvas(e.y),this.body.emitter.emit("_redraw");}else this.interactionHandler.onDrag(t);}},{key:"_finishConnect",value:function(t){var e=this.body.functions.getPointer(t.center),i=this.selectionHandler._pointerToPositionObject(e),n=void 0;void 0!==this.temporaryIds.edges[0]&&(n=this.body.edges[this.temporaryIds.edges[0]].fromId);for(var o=this.selectionHandler._getAllNodesOverlappingWith(i),r=void 0,s=o.length-1;s>=0;s--){var a;if(-1===yl(a=this.temporaryIds.nodes).call(a,o[s])){r=this.body.nodes[o[s]];break}}this._cleanupTemporaryNodesAndEdges(),void 0!==r&&(!0===r.isCluster?alert(this.options.locales[this.options.locale].createEdgeError||this.options.locales.en.createEdgeError):void 0!==this.body.nodes[n]&&void 0!==this.body.nodes[r.id]&&this._performAddEdge(n,r.id)),t.controlEdge={from:n,to:r?r.id:void 0},this.selectionHandler._generateClickEvent("controlNodeDragEnd",t,e),this.body.emitter.emit("_redraw");}},{key:"_dragStartEdge",value:function(t){var e=this.lastTouch;this.selectionHandler._generateClickEvent("dragStart",t,e,void 0,!0);}},{key:"_performAddNode",value:function(t){var e=this,i={id:zr(),x:t.pointer.canvas.x,y:t.pointer.canvas.y,label:"new"};if("function"==typeof this.options.addNode){if(2!==this.options.addNode.length)throw this.showManipulatorToolbar(),new Error("The function for add does not support two arguments (data,callback)");this.options.addNode(i,(function(t){null!=t&&"addNode"===e.inMode&&e.body.data.nodes.getDataSet().add(t),e.showManipulatorToolbar();}));}else this.body.data.nodes.getDataSet().add(i),this.showManipulatorToolbar();}},{key:"_performAddEdge",value:function(t,e){var i=this,n={from:t,to:e};if("function"==typeof this.options.addEdge){if(2!==this.options.addEdge.length)throw new Error("The function for connect does not support two arguments (data,callback)");this.options.addEdge(n,(function(t){null!=t&&"addEdge"===i.inMode&&(i.body.data.edges.getDataSet().add(t),i.selectionHandler.unselectAll(),i.showManipulatorToolbar());}));}else this.body.data.edges.getDataSet().add(n),this.selectionHandler.unselectAll(),this.showManipulatorToolbar();}},{key:"_performEditEdge",value:function(t,e){var i=this,n={id:this.edgeBeingEditedId,from:t,to:e,label:this.body.data.edges.get(this.edgeBeingEditedId).label},o=this.options.editEdge;if("object"===QS(o)&&(o=o.editWithoutDrag),"function"==typeof o){if(2!==o.length)throw new Error("The function for edit does not support two arguments (data, callback)");o(n,(function(t){null==t||"editEdge"!==i.inMode?(i.body.edges[n.id].updateEdgeType(),i.body.emitter.emit("_redraw"),i.showManipulatorToolbar()):(i.body.data.edges.getDataSet().update(t),i.selectionHandler.unselectAll(),i.showManipulatorToolbar());}));}else this.body.data.edges.getDataSet().update(n),this.selectionHandler.unselectAll(),this.showManipulatorToolbar();}}]),t}(),bT={black:"#000000",navy:"#000080",darkblue:"#00008B",mediumblue:"#0000CD",blue:"#0000FF",darkgreen:"#006400",green:"#008000",teal:"#008080",darkcyan:"#008B8B",deepskyblue:"#00BFFF",darkturquoise:"#00CED1",mediumspringgreen:"#00FA9A",lime:"#00FF00",springgreen:"#00FF7F",aqua:"#00FFFF",cyan:"#00FFFF",midnightblue:"#191970",dodgerblue:"#1E90FF",lightseagreen:"#20B2AA",forestgreen:"#228B22",seagreen:"#2E8B57",darkslategray:"#2F4F4F",limegreen:"#32CD32",mediumseagreen:"#3CB371",turquoise:"#40E0D0",royalblue:"#4169E1",steelblue:"#4682B4",darkslateblue:"#483D8B",mediumturquoise:"#48D1CC",indigo:"#4B0082",darkolivegreen:"#556B2F",cadetblue:"#5F9EA0",cornflowerblue:"#6495ED",mediumaquamarine:"#66CDAA",dimgray:"#696969",slateblue:"#6A5ACD",olivedrab:"#6B8E23",slategray:"#708090",lightslategray:"#778899",mediumslateblue:"#7B68EE",lawngreen:"#7CFC00",chartreuse:"#7FFF00",aquamarine:"#7FFFD4",maroon:"#800000",purple:"#800080",olive:"#808000",gray:"#808080",skyblue:"#87CEEB",lightskyblue:"#87CEFA",blueviolet:"#8A2BE2",darkred:"#8B0000",darkmagenta:"#8B008B",saddlebrown:"#8B4513",darkseagreen:"#8FBC8F",lightgreen:"#90EE90",mediumpurple:"#9370D8",darkviolet:"#9400D3",palegreen:"#98FB98",darkorchid:"#9932CC",yellowgreen:"#9ACD32",sienna:"#A0522D",brown:"#A52A2A",darkgray:"#A9A9A9",lightblue:"#ADD8E6",greenyellow:"#ADFF2F",paleturquoise:"#AFEEEE",lightsteelblue:"#B0C4DE",powderblue:"#B0E0E6",firebrick:"#B22222",darkgoldenrod:"#B8860B",mediumorchid:"#BA55D3",rosybrown:"#BC8F8F",darkkhaki:"#BDB76B",silver:"#C0C0C0",mediumvioletred:"#C71585",indianred:"#CD5C5C",peru:"#CD853F",chocolate:"#D2691E",tan:"#D2B48C",lightgrey:"#D3D3D3",palevioletred:"#D87093",thistle:"#D8BFD8",orchid:"#DA70D6",goldenrod:"#DAA520",crimson:"#DC143C",gainsboro:"#DCDCDC",plum:"#DDA0DD",burlywood:"#DEB887",lightcyan:"#E0FFFF",lavender:"#E6E6FA",darksalmon:"#E9967A",violet:"#EE82EE",palegoldenrod:"#EEE8AA",lightcoral:"#F08080",khaki:"#F0E68C",aliceblue:"#F0F8FF",honeydew:"#F0FFF0",azure:"#F0FFFF",sandybrown:"#F4A460",wheat:"#F5DEB3",beige:"#F5F5DC",whitesmoke:"#F5F5F5",mintcream:"#F5FFFA",ghostwhite:"#F8F8FF",salmon:"#FA8072",antiquewhite:"#FAEBD7",linen:"#FAF0E6",lightgoldenrodyellow:"#FAFAD2",oldlace:"#FDF5E6",red:"#FF0000",fuchsia:"#FF00FF",magenta:"#FF00FF",deeppink:"#FF1493",orangered:"#FF4500",tomato:"#FF6347",hotpink:"#FF69B4",coral:"#FF7F50",darkorange:"#FF8C00",lightsalmon:"#FFA07A",orange:"#FFA500",lightpink:"#FFB6C1",pink:"#FFC0CB",gold:"#FFD700",peachpuff:"#FFDAB9",navajowhite:"#FFDEAD",moccasin:"#FFE4B5",bisque:"#FFE4C4",mistyrose:"#FFE4E1",blanchedalmond:"#FFEBCD",papayawhip:"#FFEFD5",lavenderblush:"#FFF0F5",seashell:"#FFF5EE",cornsilk:"#FFF8DC",lemonchiffon:"#FFFACD",floralwhite:"#FFFAF0",snow:"#FFFAFA",yellow:"#FFFF00",lightyellow:"#FFFFE0",ivory:"#FFFFF0",white:"#FFFFFF"},wT=function(){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1;kc(this,t),this.pixelRatio=e,this.generated=!1,this.centerCoordinates={x:144.5,y:144.5},this.r=289*.49,this.color={r:255,g:255,b:255,a:1},this.hueCircle=void 0,this.initialColor={r:255,g:255,b:255,a:1},this.previousColor=void 0,this.applied=!1,this.updateCallback=function(){},this.closeCallback=function(){},this._create();}return Mc(t,[{key:"insertTo",value:function(t){void 0!==this.hammer&&(this.hammer.destroy(),this.hammer=void 0),this.container=t,this.container.appendChild(this.frame),this._bindHammer(),this._setSize();}},{key:"setUpdateCallback",value:function(t){if("function"!=typeof t)throw new Error("Function attempted to set as colorPicker update callback is not a function.");this.updateCallback=t;}},{key:"setCloseCallback",value:function(t){if("function"!=typeof t)throw new Error("Function attempted to set as colorPicker closing callback is not a function.");this.closeCallback=t;}},{key:"_isColorString",value:function(t){if("string"==typeof t)return bT[t]}},{key:"setColor",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if("none"!==t){var i,n=this._isColorString(t);if(void 0!==n&&(t=n),!0===Gr(t)){if(!0===Is(t)){var o=t.substr(4).substr(0,t.length-5).split(",");i={r:o[0],g:o[1],b:o[2],a:1};}else if(!0===Fs(t)){var r=t.substr(5).substr(0,t.length-6).split(",");i={r:r[0],g:r[1],b:r[2],a:r[3]};}else if(!0===As(t)){var s=_s(t);i={r:s.r,g:s.g,b:s.b,a:1};}}else if(t instanceof Object&&void 0!==t.r&&void 0!==t.g&&void 0!==t.b){var a=void 0!==t.a?t.a:"1.0";i={r:t.r,g:t.g,b:t.b,a:a};}if(void 0===i)throw new Error("Unknown color passed to the colorPicker. Supported are strings: rgb, hex, rgba. Object: rgb ({r:r,g:g,b:b,[a:a]}). Supplied: "+oE(t));this._setColor(i,e);}}},{key:"show",value:function(){void 0!==this.closeCallback&&(this.closeCallback(),this.closeCallback=void 0),this.applied=!1,this.frame.style.display="block",this._generateHueCircle();}},{key:"_hide",value:function(){var t=this,e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];!0===e&&(this.previousColor=$r({},this.color)),!0===this.applied&&this.updateCallback(this.initialColor),this.frame.style.display="none",Ic((function(){void 0!==t.closeCallback&&(t.closeCallback(),t.closeCallback=void 0);}),0);}},{key:"_save",value:function(){this.updateCallback(this.color),this.applied=!1,this._hide();}},{key:"_apply",value:function(){this.applied=!0,this.updateCallback(this.color),this._updatePicker(this.color);}},{key:"_loadLast",value:function(){void 0!==this.previousColor?this.setColor(this.previousColor,!1):alert("There is no last color to load...");}},{key:"_setColor",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];!0===e&&(this.initialColor=$r({},t)),this.color=t;var i=Ss(t.r,t.g,t.b),n=2*Math.PI,o=this.r*i.s,r=this.centerCoordinates.x+o*Math.sin(n*i.h),s=this.centerCoordinates.y+o*Math.cos(n*i.h);this.colorPickerSelector.style.left=r-.5*this.colorPickerSelector.clientWidth+"px",this.colorPickerSelector.style.top=s-.5*this.colorPickerSelector.clientHeight+"px",this._updatePicker(t);}},{key:"_setOpacity",value:function(t){this.color.a=t/100,this._updatePicker(this.color);}},{key:"_setBrightness",value:function(t){var e=Ss(this.color.r,this.color.g,this.color.b);e.v=t/100;var i=Ts(e.h,e.s,e.v);i.a=this.color.a,this.color=i,this._updatePicker();}},{key:"_updatePicker",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.color,e=Ss(t.r,t.g,t.b),i=this.colorPickerCanvas.getContext("2d");void 0===this.pixelRation&&(this.pixelRatio=(window.devicePixelRatio||1)/(i.webkitBackingStorePixelRatio||i.mozBackingStorePixelRatio||i.msBackingStorePixelRatio||i.oBackingStorePixelRatio||i.backingStorePixelRatio||1)),i.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);var n=this.colorPickerCanvas.clientWidth,o=this.colorPickerCanvas.clientHeight;i.clearRect(0,0,n,o),i.putImageData(this.hueCircle,0,0),i.fillStyle="rgba(0,0,0,"+(1-e.v)+")",i.circle(this.centerCoordinates.x,this.centerCoordinates.y,this.r),AM(i).call(i),this.brightnessRange.value=100*e.v,this.opacityRange.value=100*t.a,this.initialColorDiv.style.backgroundColor="rgba("+this.initialColor.r+","+this.initialColor.g+","+this.initialColor.b+","+this.initialColor.a+")",this.newColorDiv.style.backgroundColor="rgba("+this.color.r+","+this.color.g+","+this.color.b+","+this.color.a+")";}},{key:"_setSize",value:function(){this.colorPickerCanvas.style.width="100%",this.colorPickerCanvas.style.height="100%",this.colorPickerCanvas.width=289*this.pixelRatio,this.colorPickerCanvas.height=289*this.pixelRatio;}},{key:"_create",value:function(){var t,e,i,n;if(this.frame=document.createElement("div"),this.frame.className="vis-color-picker",this.colorPickerDiv=document.createElement("div"),this.colorPickerSelector=document.createElement("div"),this.colorPickerSelector.className="vis-selector",this.colorPickerDiv.appendChild(this.colorPickerSelector),this.colorPickerCanvas=document.createElement("canvas"),this.colorPickerDiv.appendChild(this.colorPickerCanvas),this.colorPickerCanvas.getContext){var o=this.colorPickerCanvas.getContext("2d");this.pixelRatio=(window.devicePixelRatio||1)/(o.webkitBackingStorePixelRatio||o.mozBackingStorePixelRatio||o.msBackingStorePixelRatio||o.oBackingStorePixelRatio||o.backingStorePixelRatio||1),this.colorPickerCanvas.getContext("2d").setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);}else{var r=document.createElement("DIV");r.style.color="red",r.style.fontWeight="bold",r.style.padding="10px",r.innerHTML="Error: your browser does not support HTML canvas",this.colorPickerCanvas.appendChild(r);}this.colorPickerDiv.className="vis-color",this.opacityDiv=document.createElement("div"),this.opacityDiv.className="vis-opacity",this.brightnessDiv=document.createElement("div"),this.brightnessDiv.className="vis-brightness",this.arrowDiv=document.createElement("div"),this.arrowDiv.className="vis-arrow",this.opacityRange=document.createElement("input");try{this.opacityRange.type="range",this.opacityRange.min="0",this.opacityRange.max="100";}catch(t){}this.opacityRange.value="100",this.opacityRange.className="vis-range",this.brightnessRange=document.createElement("input");try{this.brightnessRange.type="range",this.brightnessRange.min="0",this.brightnessRange.max="100";}catch(t){}this.brightnessRange.value="100",this.brightnessRange.className="vis-range",this.opacityDiv.appendChild(this.opacityRange),this.brightnessDiv.appendChild(this.brightnessRange);var s=this;this.opacityRange.onchange=function(){s._setOpacity(this.value);},this.opacityRange.oninput=function(){s._setOpacity(this.value);},this.brightnessRange.onchange=function(){s._setBrightness(this.value);},this.brightnessRange.oninput=function(){s._setBrightness(this.value);},this.brightnessLabel=document.createElement("div"),this.brightnessLabel.className="vis-label vis-brightness",this.brightnessLabel.innerHTML="brightness:",this.opacityLabel=document.createElement("div"),this.opacityLabel.className="vis-label vis-opacity",this.opacityLabel.innerHTML="opacity:",this.newColorDiv=document.createElement("div"),this.newColorDiv.className="vis-new-color",this.newColorDiv.innerHTML="new",this.initialColorDiv=document.createElement("div"),this.initialColorDiv.className="vis-initial-color",this.initialColorDiv.innerHTML="initial",this.cancelButton=document.createElement("div"),this.cancelButton.className="vis-button vis-cancel",this.cancelButton.innerHTML="cancel",this.cancelButton.onclick=$(t=this._hide).call(t,this,!1),this.applyButton=document.createElement("div"),this.applyButton.className="vis-button vis-apply",this.applyButton.innerHTML="apply",this.applyButton.onclick=$(e=this._apply).call(e,this),this.saveButton=document.createElement("div"),this.saveButton.className="vis-button vis-save",this.saveButton.innerHTML="save",this.saveButton.onclick=$(i=this._save).call(i,this),this.loadButton=document.createElement("div"),this.loadButton.className="vis-button vis-load",this.loadButton.innerHTML="load last",this.loadButton.onclick=$(n=this._loadLast).call(n,this),this.frame.appendChild(this.colorPickerDiv),this.frame.appendChild(this.arrowDiv),this.frame.appendChild(this.brightnessLabel),this.frame.appendChild(this.brightnessDiv),this.frame.appendChild(this.opacityLabel),this.frame.appendChild(this.opacityDiv),this.frame.appendChild(this.newColorDiv),this.frame.appendChild(this.initialColorDiv),this.frame.appendChild(this.cancelButton),this.frame.appendChild(this.applyButton),this.frame.appendChild(this.saveButton),this.frame.appendChild(this.loadButton);}},{key:"_bindHammer",value:function(){var t=this;this.drag={},this.pinch={},this.hammer=new gc(this.colorPickerCanvas),this.hammer.get("pinch").set({enable:!0}),fD.onTouch(this.hammer,(function(e){t._moveSelector(e);})),this.hammer.on("tap",(function(e){t._moveSelector(e);})),this.hammer.on("panstart",(function(e){t._moveSelector(e);})),this.hammer.on("panmove",(function(e){t._moveSelector(e);})),this.hammer.on("panend",(function(e){t._moveSelector(e);}));}},{key:"_generateHueCircle",value:function(){if(!1===this.generated){var t=this.colorPickerCanvas.getContext("2d");void 0===this.pixelRation&&(this.pixelRatio=(window.devicePixelRatio||1)/(t.webkitBackingStorePixelRatio||t.mozBackingStorePixelRatio||t.msBackingStorePixelRatio||t.oBackingStorePixelRatio||t.backingStorePixelRatio||1)),t.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);var e,i,n,o,r=this.colorPickerCanvas.clientWidth,s=this.colorPickerCanvas.clientHeight;t.clearRect(0,0,r,s),this.centerCoordinates={x:.5*r,y:.5*s},this.r=.49*r;var a,h=2*Math.PI/360,l=1/this.r;for(n=0;n<360;n++)for(o=0;o<this.r;o++)e=this.centerCoordinates.x+o*Math.sin(h*n),i=this.centerCoordinates.y+o*Math.cos(h*n),a=Ts(n*(1/360),o*l,1),t.fillStyle="rgb("+a.r+","+a.g+","+a.b+")",t.fillRect(e-.5,i-.5,2,2);t.strokeStyle="rgba(0,0,0,1)",t.circle(this.centerCoordinates.x,this.centerCoordinates.y,this.r),t.stroke(),this.hueCircle=t.getImageData(0,0,r,s);}this.generated=!0;}},{key:"_moveSelector",value:function(t){var e=this.colorPickerDiv.getBoundingClientRect(),i=t.center.x-e.left,n=t.center.y-e.top,o=.5*this.colorPickerDiv.clientHeight,r=.5*this.colorPickerDiv.clientWidth,s=i-r,a=n-o,h=Math.atan2(s,a),l=.98*Math.min(Math.sqrt(s*s+a*a),r),d=Math.cos(h)*l+o,u=Math.sin(h)*l+r;this.colorPickerSelector.style.top=d-.5*this.colorPickerSelector.clientHeight+"px",this.colorPickerSelector.style.left=u-.5*this.colorPickerSelector.clientWidth+"px";var c=h/(2*Math.PI);c=c<0?c+1:c;var f=l/this.r,p=Ss(this.color.r,this.color.g,this.color.b);p.h=c,p.s=f;var v=Ts(p.h,p.s,p.v);v.a=this.color.a,this.color=v,this.initialColorDiv.style.backgroundColor="rgba("+this.initialColor.r+","+this.initialColor.g+","+this.initialColor.b+","+this.initialColor.a+")",this.newColorDiv.style.backgroundColor="rgba("+this.color.r+","+this.color.g+","+this.color.b+","+this.color.a+")";}}]),t}(),_T=function(){function t(e,i,n){var o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:1;kc(this,t),this.parent=e,this.changedOptions=[],this.container=i,this.allowCreation=!1,this.options={},this.initialized=!1,this.popupCounter=0,this.defaultOptions={enabled:!1,filter:!0,container:void 0,showButton:!0},$r(this.options,this.defaultOptions),this.configureOptions=n,this.moduleOptions={},this.domElements=[],this.popupDiv={},this.popupLimit=5,this.popupHistory={},this.colorPicker=new wT(o),this.wrapper=void 0;}return Mc(t,[{key:"setOptions",value:function(t){if(void 0!==t){this.popupHistory={},this._removePopup();var e=!0;if("string"==typeof t)this.options.filter=t;else if(t instanceof Array)this.options.filter=t.join();else if("object"===QS(t)){if(null==t)throw new TypeError("options cannot be null");void 0!==t.container&&(this.options.container=t.container),void 0!==zO(t)&&(this.options.filter=zO(t)),void 0!==t.showButton&&(this.options.showButton=t.showButton),void 0!==t.enabled&&(e=t.enabled);}else"boolean"==typeof t?(this.options.filter=!0,e=t):"function"==typeof t&&(this.options.filter=t,e=!0);!1===zO(this.options)&&(e=!1),this.options.enabled=e;}this._clean();}},{key:"setModuleOptions",value:function(t){this.moduleOptions=t,!0===this.options.enabled&&(this._clean(),void 0!==this.options.container&&(this.container=this.options.container),this._create());}},{key:"_create",value:function(){this._clean(),this.changedOptions=[];var t=zO(this.options),e=0,i=!1;for(var n in this.configureOptions)this.configureOptions.hasOwnProperty(n)&&(this.allowCreation=!1,i=!1,"function"==typeof t?i=(i=t(n,[]))||this._handleObject(this.configureOptions[n],[n],!0):!0!==t&&-1===yl(t).call(t,n)||(i=!0),!1!==i&&(this.allowCreation=!0,e>0&&this._makeItem([]),this._makeHeader(n),this._handleObject(this.configureOptions[n],[n])),e++);this._makeButton(),this._push();}},{key:"_push",value:function(){this.wrapper=document.createElement("div"),this.wrapper.className="vis-configuration-wrapper",this.container.appendChild(this.wrapper);for(var t=0;t<this.domElements.length;t++)this.wrapper.appendChild(this.domElements[t]);this._showPopupIfNeeded();}},{key:"_clean",value:function(){for(var t=0;t<this.domElements.length;t++)this.wrapper.removeChild(this.domElements[t]);void 0!==this.wrapper&&(this.container.removeChild(this.wrapper),this.wrapper=void 0),this.domElements=[],this._removePopup();}},{key:"_getValue",value:function(t){for(var e=this.moduleOptions,i=0;i<t.length;i++){if(void 0===e[t[i]]){e=void 0;break}e=e[t[i]];}return e}},{key:"_makeItem",value:function(t){if(!0===this.allowCreation){var e=document.createElement("div");e.className="vis-configuration vis-config-item vis-config-s"+t.length;for(var i=arguments.length,n=new Array(i>1?i-1:0),o=1;o<i;o++)n[o-1]=arguments[o];return zh(n).call(n,(function(t){e.appendChild(t);})),this.domElements.push(e),this.domElements.length}return 0}},{key:"_makeHeader",value:function(t){var e=document.createElement("div");e.className="vis-configuration vis-config-header",e.innerHTML=t,this._makeItem([],e);}},{key:"_makeLabel",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=document.createElement("div");return n.className="vis-configuration vis-config-label vis-config-s"+e.length,n.innerHTML=!0===i?"<i><b>"+t+":</b></i>":t+":",n}},{key:"_makeDropdown",value:function(t,e,i){var n=document.createElement("select");n.className="vis-configuration vis-config-select";var o=0;void 0!==e&&-1!==yl(t).call(t,e)&&(o=yl(t).call(t,e));for(var r=0;r<t.length;r++){var s=document.createElement("option");s.value=t[r],r===o&&(s.selected="selected"),s.innerHTML=t[r],n.appendChild(s);}var a=this;n.onchange=function(){a._update(this.value,i);};var h=this._makeLabel(i[i.length-1],i);this._makeItem(i,h,n);}},{key:"_makeRange",value:function(t,e,i){var n=t[0],o=t[1],r=t[2],s=t[3],a=document.createElement("input");a.className="vis-configuration vis-config-range";try{a.type="range",a.min=o,a.max=r;}catch(t){}a.step=s;var h="",l=0;if(void 0!==e){e<0&&1.2*e<o?(a.min=Math.ceil(1.2*e),l=a.min,h="range increased"):e/1.2<o&&(a.min=Math.ceil(e/1.2),l=a.min,h="range increased"),1.2*e>r&&1!==r&&(a.max=Math.ceil(1.2*e),l=a.max,h="range increased"),a.value=e;}else a.value=n;var d=document.createElement("input");d.className="vis-configuration vis-config-rangeinput",d.value=a.value;var u=this;a.onchange=function(){d.value=this.value,u._update(Number(this.value),i);},a.oninput=function(){d.value=this.value;};var c=this._makeLabel(i[i.length-1],i),f=this._makeItem(i,c,a,d);""!==h&&this.popupHistory[f]!==l&&(this.popupHistory[f]=l,this._setupPopup(h,f));}},{key:"_makeButton",value:function(){var t=this;if(!0===this.options.showButton){var e=document.createElement("div");e.className="vis-configuration vis-config-button",e.innerHTML="generate options",e.onclick=function(){t._printOptions();},e.onmouseover=function(){e.className="vis-configuration vis-config-button hover";},e.onmouseout=function(){e.className="vis-configuration vis-config-button";},this.optionsContainer=document.createElement("div"),this.optionsContainer.className="vis-configuration vis-config-option-container",this.domElements.push(this.optionsContainer),this.domElements.push(e);}}},{key:"_setupPopup",value:function(t,e){var i=this;if(!0===this.initialized&&!0===this.allowCreation&&this.popupCounter<this.popupLimit){var n=document.createElement("div");n.id="vis-configuration-popup",n.className="vis-configuration-popup",n.innerHTML=t,n.onclick=function(){i._removePopup();},this.popupCounter+=1,this.popupDiv={html:n,index:e};}}},{key:"_removePopup",value:function(){void 0!==this.popupDiv.html&&(this.popupDiv.html.parentNode.removeChild(this.popupDiv.html),clearTimeout(this.popupDiv.hideTimeout),clearTimeout(this.popupDiv.deleteTimeout),this.popupDiv={});}},{key:"_showPopupIfNeeded",value:function(){var t=this;if(void 0!==this.popupDiv.html){var e=this.domElements[this.popupDiv.index].getBoundingClientRect();this.popupDiv.html.style.left=e.left+"px",this.popupDiv.html.style.top=e.top-30+"px",document.body.appendChild(this.popupDiv.html),this.popupDiv.hideTimeout=Ic((function(){t.popupDiv.html.style.opacity=0;}),1500),this.popupDiv.deleteTimeout=Ic((function(){t._removePopup();}),1800);}}},{key:"_makeCheckbox",value:function(t,e,i){var n=document.createElement("input");n.type="checkbox",n.className="vis-configuration vis-config-checkbox",n.checked=t,void 0!==e&&(n.checked=e,e!==t&&("object"===QS(t)?e!==t.enabled&&this.changedOptions.push({path:i,value:e}):this.changedOptions.push({path:i,value:e})));var o=this;n.onchange=function(){o._update(this.checked,i);};var r=this._makeLabel(i[i.length-1],i);this._makeItem(i,r,n);}},{key:"_makeTextInput",value:function(t,e,i){var n=document.createElement("input");n.type="text",n.className="vis-configuration vis-config-text",n.value=e,e!==t&&this.changedOptions.push({path:i,value:e});var o=this;n.onchange=function(){o._update(this.value,i);};var r=this._makeLabel(i[i.length-1],i);this._makeItem(i,r,n);}},{key:"_makeColorField",value:function(t,e,i){var n=this,o=t[1],r=document.createElement("div");"none"!==(e=void 0===e?o:e)?(r.className="vis-configuration vis-config-colorBlock",r.style.backgroundColor=e):r.className="vis-configuration vis-config-colorBlock none",e=void 0===e?o:e,r.onclick=function(){n._showColorPicker(e,r,i);};var s=this._makeLabel(i[i.length-1],i);this._makeItem(i,s,r);}},{key:"_showColorPicker",value:function(t,e,i){var n=this;e.onclick=function(){},this.colorPicker.insertTo(e),this.colorPicker.show(),this.colorPicker.setColor(t),this.colorPicker.setUpdateCallback((function(t){var o="rgba("+t.r+","+t.g+","+t.b+","+t.a+")";e.style.backgroundColor=o,n._update(o,i);})),this.colorPicker.setCloseCallback((function(){e.onclick=function(){n._showColorPicker(t,e,i);};}));}},{key:"_handleObject",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=!1,o=zO(this.options),r=!1;for(var s in t)if(t.hasOwnProperty(s)){n=!0;var a=t[s],h=os(e,s);if("function"==typeof o&&!1===(n=o(s,e))&&!(a instanceof Array)&&"string"!=typeof a&&"boolean"!=typeof a&&a instanceof Object&&(this.allowCreation=!1,n=this._handleObject(a,h,!0),this.allowCreation=!1===i),!1!==n){r=!0;var l=this._getValue(h);if(a instanceof Array)this._handleArray(a,l,h);else if("string"==typeof a)this._makeTextInput(a,l,h);else if("boolean"==typeof a)this._makeCheckbox(a,l,h);else if(a instanceof Object){var d=!0;if(-1!==yl(e).call(e,"physics")&&this.moduleOptions.physics.solver!==s&&(d=!1),!0===d)if(void 0!==a.enabled){var u=os(h,"enabled"),c=this._getValue(u);if(!0===c){var f=this._makeLabel(s,h,!0);this._makeItem(h,f),r=this._handleObject(a,h)||r;}else this._makeCheckbox(a,c,h);}else{var p=this._makeLabel(s,h,!0);this._makeItem(h,p),r=this._handleObject(a,h)||r;}}else console.error("dont know how to handle",a,s,h);}}return r}},{key:"_handleArray",value:function(t,e,i){"string"==typeof t[0]&&"color"===t[0]?(this._makeColorField(t,e,i),t[1]!==e&&this.changedOptions.push({path:i,value:e})):"string"==typeof t[0]?(this._makeDropdown(t,e,i),t[0]!==e&&this.changedOptions.push({path:i,value:e})):"number"==typeof t[0]&&(this._makeRange(t,e,i),t[0]!==e&&this.changedOptions.push({path:i,value:Number(e)}));}},{key:"_update",value:function(t,e){var i=this._constructOptions(t,e);this.parent.body&&this.parent.body.emitter&&this.parent.body.emitter.emit&&this.parent.body.emitter.emit("configChange",i),this.initialized=!0,this.parent.setOptions(i);}},{key:"_constructOptions",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},n=i;t="false"!==(t="true"===t||t)&&t;for(var o=0;o<e.length;o++)"global"!==e[o]&&(void 0===n[e[o]]&&(n[e[o]]={}),o!==e.length-1?n=n[e[o]]:n[e[o]]=t);return i}},{key:"_printOptions",value:function(){var t=this.getOptions();this.optionsContainer.innerHTML="<pre>var options = "+oE(t,null,2)+"</pre>";}},{key:"getOptions",value:function(){for(var t={},e=0;e<this.changedOptions.length;e++)this._constructOptions(this.changedOptions[e].value,this.changedOptions[e].path,t);return t}}]),t}(),kT="string",xT="boolean",OT="number",ST="object",MT=["arrow","bar","box","circle","crow","curve","diamond","image","inv_curve","inv_triangle","triangle","vee"],ET={configure:{enabled:{boolean:xT},filter:{boolean:xT,string:kT,array:"array",function:"function"},container:{dom:"dom"},showButton:{boolean:xT},__type__:{object:ST,boolean:xT,string:kT,array:"array",function:"function"}},edges:{arrows:{to:{enabled:{boolean:xT},scaleFactor:{number:OT},type:{string:MT},imageHeight:{number:OT},imageWidth:{number:OT},src:{string:kT},__type__:{object:ST,boolean:xT}},middle:{enabled:{boolean:xT},scaleFactor:{number:OT},type:{string:MT},imageWidth:{number:OT},imageHeight:{number:OT},src:{string:kT},__type__:{object:ST,boolean:xT}},from:{enabled:{boolean:xT},scaleFactor:{number:OT},type:{string:MT},imageWidth:{number:OT},imageHeight:{number:OT},src:{string:kT},__type__:{object:ST,boolean:xT}},__type__:{string:["from","to","middle"],object:ST}},arrowStrikethrough:{boolean:xT},background:{enabled:{boolean:xT},color:{string:kT},size:{number:OT},dashes:{boolean:xT,array:"array"},__type__:{object:ST,boolean:xT}},chosen:{label:{boolean:xT,function:"function"},edge:{boolean:xT,function:"function"},__type__:{object:ST,boolean:xT}},color:{color:{string:kT},highlight:{string:kT},hover:{string:kT},inherit:{string:["from","to","both"],boolean:xT},opacity:{number:OT},__type__:{object:ST,string:kT}},dashes:{boolean:xT,array:"array"},font:{color:{string:kT},size:{number:OT},face:{string:kT},background:{string:kT},strokeWidth:{number:OT},strokeColor:{string:kT},align:{string:["horizontal","top","middle","bottom"]},vadjust:{number:OT},multi:{boolean:xT,string:kT},bold:{color:{string:kT},size:{number:OT},face:{string:kT},mod:{string:kT},vadjust:{number:OT},__type__:{object:ST,string:kT}},boldital:{color:{string:kT},size:{number:OT},face:{string:kT},mod:{string:kT},vadjust:{number:OT},__type__:{object:ST,string:kT}},ital:{color:{string:kT},size:{number:OT},face:{string:kT},mod:{string:kT},vadjust:{number:OT},__type__:{object:ST,string:kT}},mono:{color:{string:kT},size:{number:OT},face:{string:kT},mod:{string:kT},vadjust:{number:OT},__type__:{object:ST,string:kT}},__type__:{object:ST,string:kT}},hidden:{boolean:xT},hoverWidth:{function:"function",number:OT},label:{string:kT,undefined:"undefined"},labelHighlightBold:{boolean:xT},length:{number:OT,undefined:"undefined"},physics:{boolean:xT},scaling:{min:{number:OT},max:{number:OT},label:{enabled:{boolean:xT},min:{number:OT},max:{number:OT},maxVisible:{number:OT},drawThreshold:{number:OT},__type__:{object:ST,boolean:xT}},customScalingFunction:{function:"function"},__type__:{object:ST}},selectionWidth:{function:"function",number:OT},selfReferenceSize:{number:OT},shadow:{enabled:{boolean:xT},color:{string:kT},size:{number:OT},x:{number:OT},y:{number:OT},__type__:{object:ST,boolean:xT}},smooth:{enabled:{boolean:xT},type:{string:["dynamic","continuous","discrete","diagonalCross","straightCross","horizontal","vertical","curvedCW","curvedCCW","cubicBezier"]},roundness:{number:OT},forceDirection:{string:["horizontal","vertical","none"],boolean:xT},__type__:{object:ST,boolean:xT}},title:{string:kT,undefined:"undefined"},width:{number:OT},widthConstraint:{maximum:{number:OT},__type__:{object:ST,boolean:xT,number:OT}},value:{number:OT,undefined:"undefined"},__type__:{object:ST}},groups:{useDefaultGroups:{boolean:xT},__any__:"get from nodes, will be overwritten below",__type__:{object:ST}},interaction:{dragNodes:{boolean:xT},dragView:{boolean:xT},hideEdgesOnDrag:{boolean:xT},hideEdgesOnZoom:{boolean:xT},hideNodesOnDrag:{boolean:xT},hover:{boolean:xT},keyboard:{enabled:{boolean:xT},speed:{x:{number:OT},y:{number:OT},zoom:{number:OT},__type__:{object:ST}},bindToWindow:{boolean:xT},__type__:{object:ST,boolean:xT}},multiselect:{boolean:xT},navigationButtons:{boolean:xT},selectable:{boolean:xT},selectConnectedEdges:{boolean:xT},hoverConnectedEdges:{boolean:xT},tooltipDelay:{number:OT},zoomView:{boolean:xT},zoomSpeed:{number:OT},__type__:{object:ST}},layout:{randomSeed:{undefined:"undefined",number:OT},improvedLayout:{boolean:xT},clusterThreshold:{number:OT},hierarchical:{enabled:{boolean:xT},levelSeparation:{number:OT},nodeSpacing:{number:OT},treeSpacing:{number:OT},blockShifting:{boolean:xT},edgeMinimization:{boolean:xT},parentCentralization:{boolean:xT},direction:{string:["UD","DU","LR","RL"]},sortMethod:{string:["hubsize","directed"]},shakeTowards:{string:["leaves","roots"]},__type__:{object:ST,boolean:xT}},__type__:{object:ST}},manipulation:{enabled:{boolean:xT},initiallyActive:{boolean:xT},addNode:{boolean:xT,function:"function"},addEdge:{boolean:xT,function:"function"},editNode:{function:"function"},editEdge:{editWithoutDrag:{function:"function"},__type__:{object:ST,boolean:xT,function:"function"}},deleteNode:{boolean:xT,function:"function"},deleteEdge:{boolean:xT,function:"function"},controlNodeStyle:"get from nodes, will be overwritten below",__type__:{object:ST,boolean:xT}},nodes:{borderWidth:{number:OT},borderWidthSelected:{number:OT,undefined:"undefined"},brokenImage:{string:kT,undefined:"undefined"},chosen:{label:{boolean:xT,function:"function"},node:{boolean:xT,function:"function"},__type__:{object:ST,boolean:xT}},color:{border:{string:kT},background:{string:kT},highlight:{border:{string:kT},background:{string:kT},__type__:{object:ST,string:kT}},hover:{border:{string:kT},background:{string:kT},__type__:{object:ST,string:kT}},__type__:{object:ST,string:kT}},fixed:{x:{boolean:xT},y:{boolean:xT},__type__:{object:ST,boolean:xT}},font:{align:{string:kT},color:{string:kT},size:{number:OT},face:{string:kT},background:{string:kT},strokeWidth:{number:OT},strokeColor:{string:kT},vadjust:{number:OT},multi:{boolean:xT,string:kT},bold:{color:{string:kT},size:{number:OT},face:{string:kT},mod:{string:kT},vadjust:{number:OT},__type__:{object:ST,string:kT}},boldital:{color:{string:kT},size:{number:OT},face:{string:kT},mod:{string:kT},vadjust:{number:OT},__type__:{object:ST,string:kT}},ital:{color:{string:kT},size:{number:OT},face:{string:kT},mod:{string:kT},vadjust:{number:OT},__type__:{object:ST,string:kT}},mono:{color:{string:kT},size:{number:OT},face:{string:kT},mod:{string:kT},vadjust:{number:OT},__type__:{object:ST,string:kT}},__type__:{object:ST,string:kT}},group:{string:kT,number:OT,undefined:"undefined"},heightConstraint:{minimum:{number:OT},valign:{string:kT},__type__:{object:ST,boolean:xT,number:OT}},hidden:{boolean:xT},icon:{face:{string:kT},code:{string:kT},size:{number:OT},color:{string:kT},weight:{string:kT,number:OT},__type__:{object:ST}},id:{string:kT,number:OT},image:{selected:{string:kT,undefined:"undefined"},unselected:{string:kT,undefined:"undefined"},__type__:{object:ST,string:kT}},imagePadding:{top:{number:OT},right:{number:OT},bottom:{number:OT},left:{number:OT},__type__:{object:ST,number:OT}},label:{string:kT,undefined:"undefined"},labelHighlightBold:{boolean:xT},level:{number:OT,undefined:"undefined"},margin:{top:{number:OT},right:{number:OT},bottom:{number:OT},left:{number:OT},__type__:{object:ST,number:OT}},mass:{number:OT},physics:{boolean:xT},scaling:{min:{number:OT},max:{number:OT},label:{enabled:{boolean:xT},min:{number:OT},max:{number:OT},maxVisible:{number:OT},drawThreshold:{number:OT},__type__:{object:ST,boolean:xT}},customScalingFunction:{function:"function"},__type__:{object:ST}},shadow:{enabled:{boolean:xT},color:{string:kT},size:{number:OT},x:{number:OT},y:{number:OT},__type__:{object:ST,boolean:xT}},shape:{string:["ellipse","circle","database","box","text","image","circularImage","diamond","dot","star","triangle","triangleDown","square","icon","hexagon"]},shapeProperties:{borderDashes:{boolean:xT,array:"array"},borderRadius:{number:OT},interpolation:{boolean:xT},useImageSize:{boolean:xT},useBorderWithImage:{boolean:xT},__type__:{object:ST}},size:{number:OT},title:{string:kT,dom:"dom",undefined:"undefined"},value:{number:OT,undefined:"undefined"},widthConstraint:{minimum:{number:OT},maximum:{number:OT},__type__:{object:ST,boolean:xT,number:OT}},x:{number:OT},y:{number:OT},__type__:{object:ST}},physics:{enabled:{boolean:xT},barnesHut:{gravitationalConstant:{number:OT},centralGravity:{number:OT},springLength:{number:OT},springConstant:{number:OT},damping:{number:OT},avoidOverlap:{number:OT},__type__:{object:ST}},forceAtlas2Based:{gravitationalConstant:{number:OT},centralGravity:{number:OT},springLength:{number:OT},springConstant:{number:OT},damping:{number:OT},avoidOverlap:{number:OT},__type__:{object:ST}},repulsion:{centralGravity:{number:OT},springLength:{number:OT},springConstant:{number:OT},nodeDistance:{number:OT},damping:{number:OT},__type__:{object:ST}},hierarchicalRepulsion:{centralGravity:{number:OT},springLength:{number:OT},springConstant:{number:OT},nodeDistance:{number:OT},damping:{number:OT},avoidOverlap:{number:OT},__type__:{object:ST}},maxVelocity:{number:OT},minVelocity:{number:OT},solver:{string:["barnesHut","repulsion","hierarchicalRepulsion","forceAtlas2Based"]},stabilization:{enabled:{boolean:xT},iterations:{number:OT},updateInterval:{number:OT},onlyDynamicEdges:{boolean:xT},fit:{boolean:xT},__type__:{object:ST,boolean:xT}},timestep:{number:OT},adaptiveTimestep:{boolean:xT},__type__:{object:ST,boolean:xT}},autoResize:{boolean:xT},clickToUse:{boolean:xT},locale:{string:kT},locales:{__any__:{any:"any"},__type__:{object:ST}},height:{string:kT},width:{string:kT},__type__:{object:ST}};ET.groups.__any__=ET.nodes,ET.manipulation.controlNodeStyle=ET.nodes;var DT={nodes:{borderWidth:[1,0,10,1],borderWidthSelected:[2,0,10,1],color:{border:["color","#2B7CE9"],background:["color","#97C2FC"],highlight:{border:["color","#2B7CE9"],background:["color","#D2E5FF"]},hover:{border:["color","#2B7CE9"],background:["color","#D2E5FF"]}},fixed:{x:!1,y:!1},font:{color:["color","#343434"],size:[14,0,100,1],face:["arial","verdana","tahoma"],background:["color","none"],strokeWidth:[0,0,50,1],strokeColor:["color","#ffffff"]},hidden:!1,labelHighlightBold:!0,physics:!0,scaling:{min:[10,0,200,1],max:[30,0,200,1],label:{enabled:!1,min:[14,0,200,1],max:[30,0,200,1],maxVisible:[30,0,200,1],drawThreshold:[5,0,20,1]}},shadow:{enabled:!1,color:"rgba(0,0,0,0.5)",size:[10,0,20,1],x:[5,-30,30,1],y:[5,-30,30,1]},shape:["ellipse","box","circle","database","diamond","dot","square","star","text","triangle","triangleDown","hexagon"],shapeProperties:{borderDashes:!1,borderRadius:[6,0,20,1],interpolation:!0,useImageSize:!1},size:[25,0,200,1]},edges:{arrows:{to:{enabled:!1,scaleFactor:[1,0,3,.05],type:"arrow"},middle:{enabled:!1,scaleFactor:[1,0,3,.05],type:"arrow"},from:{enabled:!1,scaleFactor:[1,0,3,.05],type:"arrow"}},arrowStrikethrough:!0,color:{color:["color","#848484"],highlight:["color","#848484"],hover:["color","#848484"],inherit:["from","to","both",!0,!1],opacity:[1,0,1,.05]},dashes:!1,font:{color:["color","#343434"],size:[14,0,100,1],face:["arial","verdana","tahoma"],background:["color","none"],strokeWidth:[2,0,50,1],strokeColor:["color","#ffffff"],align:["horizontal","top","middle","bottom"]},hidden:!1,hoverWidth:[1.5,0,5,.1],labelHighlightBold:!0,physics:!0,scaling:{min:[1,0,100,1],max:[15,0,100,1],label:{enabled:!0,min:[14,0,200,1],max:[30,0,200,1],maxVisible:[30,0,200,1],drawThreshold:[5,0,20,1]}},selectionWidth:[1.5,0,5,.1],selfReferenceSize:[20,0,200,1],shadow:{enabled:!1,color:"rgba(0,0,0,0.5)",size:[10,0,20,1],x:[5,-30,30,1],y:[5,-30,30,1]},smooth:{enabled:!0,type:["dynamic","continuous","discrete","diagonalCross","straightCross","horizontal","vertical","curvedCW","curvedCCW","cubicBezier"],forceDirection:["horizontal","vertical","none"],roundness:[.5,0,1,.05]},width:[1,0,30,1]},layout:{hierarchical:{enabled:!1,levelSeparation:[150,20,500,5],nodeSpacing:[100,20,500,5],treeSpacing:[200,20,500,5],blockShifting:!0,edgeMinimization:!0,parentCentralization:!0,direction:["UD","DU","LR","RL"],sortMethod:["hubsize","directed"],shakeTowards:["leaves","roots"]}},interaction:{dragNodes:!0,dragView:!0,hideEdgesOnDrag:!1,hideEdgesOnZoom:!1,hideNodesOnDrag:!1,hover:!1,keyboard:{enabled:!1,speed:{x:[10,0,40,1],y:[10,0,40,1],zoom:[.02,0,.1,.005]},bindToWindow:!0},multiselect:!1,navigationButtons:!1,selectable:!0,selectConnectedEdges:!0,hoverConnectedEdges:!0,tooltipDelay:[300,0,1e3,25],zoomView:!0,zoomSpeed:[1,1,1,1]},manipulation:{enabled:!1,initiallyActive:!1},physics:{enabled:!0,barnesHut:{gravitationalConstant:[-2e3,-3e4,0,50],centralGravity:[.3,0,10,.05],springLength:[95,0,500,5],springConstant:[.04,0,1.2,.005],damping:[.09,0,1,.01],avoidOverlap:[0,0,1,.01]},forceAtlas2Based:{gravitationalConstant:[-50,-500,0,1],centralGravity:[.01,0,1,.005],springLength:[95,0,500,5],springConstant:[.08,0,1.2,.005],damping:[.4,0,1,.01],avoidOverlap:[0,0,1,.01]},repulsion:{centralGravity:[.2,0,10,.05],springLength:[200,0,500,5],springConstant:[.05,0,1.2,.005],nodeDistance:[100,0,500,5],damping:[.09,0,1,.01]},hierarchicalRepulsion:{centralGravity:[.2,0,10,.05],springLength:[100,0,500,5],springConstant:[.01,0,1.2,.005],nodeDistance:[120,0,500,5],damping:[.09,0,1,.01],avoidOverlap:[0,0,1,.01]},maxVelocity:[50,0,150,1],minVelocity:[.1,.01,.5,.01],solver:["barnesHut","forceAtlas2Based","repulsion","hierarchicalRepulsion"],timestep:[.5,.01,1,.01]}},TT=Object.freeze({__proto__:null,allOptions:ET,configureOptions:DT}),CT=function(){function t(){kc(this,t);}return Mc(t,[{key:"getDistances",value:function(t,e,i){for(var n={},o=t.edges,r=0;r<e.length;r++){var s={};n[e[r]]=s;for(var a=0;a<e.length;a++)s[e[a]]=r==a?0:1e9;}for(var h=0;h<i.length;h++){var l=o[i[h]];!0===l.connected&&void 0!==n[l.fromId]&&void 0!==n[l.toId]&&(n[l.fromId][l.toId]=1,n[l.toId][l.fromId]=1);}for(var d=e.length,u=0;u<d;u++)for(var c=e[u],f=n[c],p=0;p<d-1;p++)for(var v=e[p],y=n[v],g=p+1;g<d;g++){var m=e[g],b=n[m],w=Math.min(y[m],y[c]+f[m]);y[m]=w,b[v]=w;}return n}}]),t}(),PT=function(){function t(e,i,n){kc(this,t),this.body=e,this.springLength=i,this.springConstant=n,this.distanceSolver=new CT;}return Mc(t,[{key:"setOptions",value:function(t){t&&(t.springLength&&(this.springLength=t.springLength),t.springConstant&&(this.springConstant=t.springConstant));}},{key:"solve",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=this.distanceSolver.getDistances(this.body,t,e);this._createL_matrix(n),this._createK_matrix(n),this._createE_matrix();for(var o=.01,r=1,s=0,a=Math.max(1e3,Math.min(10*this.body.nodeIndices.length,6e3)),h=5,l=1e9,d=0,u=0,c=0,f=0,p=0;l>o&&s<a;){s+=1;var v=this._getHighestEnergyNode(i),y=US(v,4);for(d=y[0],l=y[1],u=y[2],c=y[3],f=l,p=0;f>r&&p<h;){p+=1,this._moveNode(d,u,c);var g=this._getEnergy(d),m=US(g,3);f=m[0],u=m[1],c=m[2];}}}},{key:"_getHighestEnergyNode",value:function(t){for(var e=this.body.nodeIndices,i=this.body.nodes,n=0,o=e[0],r=0,s=0,a=0;a<e.length;a++){var h=e[a];if(!1===i[h].predefinedPosition||!0===i[h].isCluster&&!0===t||!0===i[h].options.fixed.x||!0===i[h].options.fixed.y){var l=this._getEnergy(h),d=US(l,3),u=d[0],c=d[1],f=d[2];n<u&&(n=u,o=h,r=c,s=f);}}return [o,n,r,s]}},{key:"_getEnergy",value:function(t){var e=US(this.E_sums[t],2),i=e[0],n=e[1];return [Math.sqrt(Math.pow(i,2)+Math.pow(n,2)),i,n]}},{key:"_moveNode",value:function(t,e,i){for(var n=this.body.nodeIndices,o=this.body.nodes,r=0,s=0,a=0,h=o[t].x,l=o[t].y,d=this.K_matrix[t],u=this.L_matrix[t],c=0;c<n.length;c++){var f=n[c];if(f!==t){var p=o[f].x,v=o[f].y,y=d[f],g=u[f],m=1/Math.pow(Math.pow(h-p,2)+Math.pow(l-v,2),1.5);r+=y*(1-g*Math.pow(l-v,2)*m),s+=y*(g*(h-p)*(l-v)*m),a+=y*(1-g*Math.pow(h-p,2)*m);}}var b=(e/r+i/s)/(s/r-a/s),w=-(s*b+e)/r;o[t].x+=w,o[t].y+=b,this._updateE_matrix(t);}},{key:"_createL_matrix",value:function(t){var e=this.body.nodeIndices,i=this.springLength;this.L_matrix=[];for(var n=0;n<e.length;n++){this.L_matrix[e[n]]={};for(var o=0;o<e.length;o++)this.L_matrix[e[n]][e[o]]=i*t[e[n]][e[o]];}}},{key:"_createK_matrix",value:function(t){var e=this.body.nodeIndices,i=this.springConstant;this.K_matrix=[];for(var n=0;n<e.length;n++){this.K_matrix[e[n]]={};for(var o=0;o<e.length;o++)this.K_matrix[e[n]][e[o]]=i*Math.pow(t[e[n]][e[o]],-2);}}},{key:"_createE_matrix",value:function(){var t=this.body.nodeIndices,e=this.body.nodes;this.E_matrix={},this.E_sums={};for(var i=0;i<t.length;i++)this.E_matrix[t[i]]=[];for(var n=0;n<t.length;n++){for(var o=t[n],r=e[o].x,s=e[o].y,a=0,h=0,l=n;l<t.length;l++){var d=t[l];if(d!==o){var u=e[d].x,c=e[d].y,f=1/Math.sqrt(Math.pow(r-u,2)+Math.pow(s-c,2));this.E_matrix[o][l]=[this.K_matrix[o][d]*(r-u-this.L_matrix[o][d]*(r-u)*f),this.K_matrix[o][d]*(s-c-this.L_matrix[o][d]*(s-c)*f)],this.E_matrix[d][n]=this.E_matrix[o][l],a+=this.E_matrix[o][l][0],h+=this.E_matrix[o][l][1];}}this.E_sums[o]=[a,h];}}},{key:"_updateE_matrix",value:function(t){for(var e=this.body.nodeIndices,i=this.body.nodes,n=this.E_matrix[t],o=this.K_matrix[t],r=this.L_matrix[t],s=i[t].x,a=i[t].y,h=0,l=0,d=0;d<e.length;d++){var u=e[d];if(u!==t){var c=n[d],f=c[0],p=c[1],v=i[u].x,y=i[u].y,g=1/Math.sqrt(Math.pow(s-v,2)+Math.pow(a-y,2)),m=o[u]*(s-v-r[u]*(s-v)*g),b=o[u]*(a-y-r[u]*(a-y)*g);n[d]=[m,b],h+=m,l+=b;var w=this.E_sums[u];w[0]+=m-f,w[1]+=b-p;}}this.E_sums[t]=[h,l];}}]),t}();function AT(t,e,i){var n,o,r,s,a=this;if(!(this instanceof AT))throw new SyntaxError("Constructor must be called with the new operator");this.options={},this.defaultOptions={locale:"en",locales:_c,clickToUse:!1},$r(this.options,this.defaultOptions),this.body={container:t,nodes:{},nodeIndices:[],edges:{},edgeIndices:[],emitter:{on:$(n=this.on).call(n,this),off:$(o=this.off).call(o,this),emit:$(r=this.emit).call(r,this),once:$(s=this.once).call(s,this)},eventListeners:{onTap:function(){},onTouch:function(){},onDoubleTap:function(){},onHold:function(){},onDragStart:function(){},onDrag:function(){},onDragEnd:function(){},onMouseWheel:function(){},onPinch:function(){},onMouseMove:function(){},onRelease:function(){},onContext:function(){}},data:{nodes:null,edges:null},functions:{createNode:function(){},createEdge:function(){},getPointer:function(){}},modules:{},view:{scale:1,translation:{x:0,y:0}}},this.bindEventListeners(),this.images=new Dc((function(){return a.body.emitter.emit("_requestRedraw")})),this.groups=new Tc,this.canvas=new pD(this.body),this.selectionHandler=new kD(this.body,this.canvas),this.interactionHandler=new _D(this.body,this.canvas,this.selectionHandler),this.view=new mD(this.body,this.canvas),this.renderer=new uD(this.body,this.canvas),this.physics=new iD(this.body),this.layoutEngine=new gT(this.body),this.clustering=new dD(this.body),this.manipulation=new mT(this.body,this.canvas,this.selectionHandler,this.interactionHandler),this.nodesHandler=new dE(this.body,this.images,this.groups,this.layoutEngine),this.edgesHandler=new UE(this.body,this.images,this.groups),this.body.modules.kamadaKawai=new PT(this.body,150,.05),this.body.modules.clustering=this.clustering,this.canvas._create(),this.setOptions(i),this.setData(e);}ot(AT.prototype),AT.prototype.setOptions=function(t){var e=this;if(null===t&&(t=void 0),void 0!==t){!0===aE.validate(t,ET)&&console.log("%cErrors have been found in the supplied options object.",sE);if(Qr(["locale","locales","clickToUse"],this.options,t),t=this.layoutEngine.setOptions(t.layout,t),this.canvas.setOptions(t),this.groups.setOptions(t.groups),this.nodesHandler.setOptions(t.nodes),this.edgesHandler.setOptions(t.edges),this.physics.setOptions(t.physics),this.manipulation.setOptions(t.manipulation,t,this.options),this.interactionHandler.setOptions(t.interaction),this.renderer.setOptions(t.interaction),this.selectionHandler.setOptions(t.interaction),void 0!==t.groups&&this.body.emitter.emit("refreshNodes"),"configure"in t&&(this.configurator||(this.configurator=new _T(this,this.body.container,DT,this.canvas.pixelRatio)),this.configurator.setOptions(t.configure)),this.configurator&&!0===this.configurator.options.enabled){var i={nodes:{},edges:{},layout:{},interaction:{},manipulation:{},physics:{},global:{}};es(i.nodes,this.nodesHandler.options),es(i.edges,this.edgesHandler.options),es(i.layout,this.layoutEngine.options),es(i.interaction,this.selectionHandler.options),es(i.interaction,this.renderer.options),es(i.interaction,this.interactionHandler.options),es(i.manipulation,this.manipulation.options),es(i.physics,this.physics.options),es(i.global,this.canvas.options),es(i.global,this.options),this.configurator.setModuleOptions(i);}void 0!==t.clickToUse?!0===t.clickToUse?void 0===this.activator&&(this.activator=new wc(this.canvas.frame),this.activator.on("change",(function(){e.body.emitter.emit("activate");}))):(void 0!==this.activator&&(this.activator.destroy(),delete this.activator),this.body.emitter.emit("activate")):this.body.emitter.emit("activate"),this.canvas.setSize(),this.body.emitter.emit("startSimulation");}},AT.prototype._updateVisibleIndices=function(){var t=this.body.nodes,e=this.body.edges;for(var i in this.body.nodeIndices=[],this.body.edgeIndices=[],t)t.hasOwnProperty(i)&&(this.clustering._isClusteredNode(i)||!1!==t[i].options.hidden||this.body.nodeIndices.push(t[i].id));for(var n in e)if(e.hasOwnProperty(n)){var o=e[n],r=t[o.fromId],s=t[o.toId],a=void 0!==r&&void 0!==s;!this.clustering._isClusteredEdge(n)&&!1===o.options.hidden&&a&&!1===r.options.hidden&&!1===s.options.hidden&&this.body.edgeIndices.push(o.id);}},AT.prototype.bindEventListeners=function(){var t=this;this.body.emitter.on("_dataChanged",(function(){t.edgesHandler._updateState(),t.body.emitter.emit("_dataUpdated");})),this.body.emitter.on("_dataUpdated",(function(){t.clustering._updateState(),t._updateVisibleIndices(),t._updateValueRange(t.body.nodes),t._updateValueRange(t.body.edges),t.body.emitter.emit("startSimulation"),t.body.emitter.emit("_requestRedraw");}));},AT.prototype.setData=function(t){if(this.body.emitter.emit("resetPhysics"),this.body.emitter.emit("_resetData"),this.selectionHandler.unselectAll(),t&&t.dot&&(t.nodes||t.edges))throw new SyntaxError('Data must contain either parameter "dot" or  parameter pair "nodes" and "edges", but not both.');if(this.setOptions(t&&t.options),t&&t.dot){console.log("The dot property has been deprecated. Please use the static convertDot method to convert DOT into vis.network format and use the normal data format with nodes and edges. This converter is used like this: var data = vis.network.convertDot(dotString);");var e=$l.DOTToGraph(t.dot);this.setData(e);}else if(t&&t.gephi){console.log("The gephi property has been deprecated. Please use the static convertGephi method to convert gephi into vis.network format and use the normal data format with nodes and edges. This converter is used like this: var data = vis.network.convertGephi(gephiJson);");var i=rd(t.gephi);this.setData(i);}else this.nodesHandler.setData(t&&t.nodes,!0),this.edgesHandler.setData(t&&t.edges,!0),this.body.emitter.emit("_dataChanged"),this.body.emitter.emit("_dataLoaded"),this.body.emitter.emit("initPhysics");},AT.prototype.destroy=function(){for(var t in this.body.emitter.emit("destroy"),this.body.emitter.off(),this.off(),delete this.groups,delete this.canvas,delete this.selectionHandler,delete this.interactionHandler,delete this.view,delete this.renderer,delete this.physics,delete this.layoutEngine,delete this.clustering,delete this.manipulation,delete this.nodesHandler,delete this.edgesHandler,delete this.configurator,delete this.images,this.body.nodes)this.body.nodes.hasOwnProperty(t)&&delete this.body.nodes[t];for(var e in this.body.edges)this.body.edges.hasOwnProperty(e)&&delete this.body.edges[e];Ur(this.body.container);},AT.prototype._updateValueRange=function(t){var e,i=void 0,n=void 0,o=0;for(e in t)if(t.hasOwnProperty(e)){var r=t[e].getValue();void 0!==r&&(i=void 0===i?r:Math.min(r,i),n=void 0===n?r:Math.max(r,n),o+=r);}if(void 0!==i&&void 0!==n)for(e in t)t.hasOwnProperty(e)&&t[e].setValueRange(i,n,o);},AT.prototype.isActive=function(){return !this.activator||this.activator.active},AT.prototype.setSize=function(){return this.canvas.setSize.apply(this.canvas,arguments)},AT.prototype.canvasToDOM=function(){return this.canvas.canvasToDOM.apply(this.canvas,arguments)},AT.prototype.DOMtoCanvas=function(){return this.canvas.DOMtoCanvas.apply(this.canvas,arguments)},AT.prototype.findNode=function(){return this.clustering.findNode.apply(this.clustering,arguments)},AT.prototype.isCluster=function(){return this.clustering.isCluster.apply(this.clustering,arguments)},AT.prototype.openCluster=function(){return this.clustering.openCluster.apply(this.clustering,arguments)},AT.prototype.cluster=function(){return this.clustering.cluster.apply(this.clustering,arguments)},AT.prototype.getNodesInCluster=function(){return this.clustering.getNodesInCluster.apply(this.clustering,arguments)},AT.prototype.clusterByConnection=function(){return this.clustering.clusterByConnection.apply(this.clustering,arguments)},AT.prototype.clusterByHubsize=function(){return this.clustering.clusterByHubsize.apply(this.clustering,arguments)},AT.prototype.clusterOutliers=function(){return this.clustering.clusterOutliers.apply(this.clustering,arguments)},AT.prototype.getSeed=function(){return this.layoutEngine.getSeed.apply(this.layoutEngine,arguments)},AT.prototype.enableEditMode=function(){return this.manipulation.enableEditMode.apply(this.manipulation,arguments)},AT.prototype.disableEditMode=function(){return this.manipulation.disableEditMode.apply(this.manipulation,arguments)},AT.prototype.addNodeMode=function(){return this.manipulation.addNodeMode.apply(this.manipulation,arguments)},AT.prototype.editNode=function(){return this.manipulation.editNode.apply(this.manipulation,arguments)},AT.prototype.editNodeMode=function(){return console.log("Deprecated: Please use editNode instead of editNodeMode."),this.manipulation.editNode.apply(this.manipulation,arguments)},AT.prototype.addEdgeMode=function(){return this.manipulation.addEdgeMode.apply(this.manipulation,arguments)},AT.prototype.editEdgeMode=function(){return this.manipulation.editEdgeMode.apply(this.manipulation,arguments)},AT.prototype.deleteSelected=function(){return this.manipulation.deleteSelected.apply(this.manipulation,arguments)},AT.prototype.getPositions=function(){return this.nodesHandler.getPositions.apply(this.nodesHandler,arguments)},AT.prototype.storePositions=function(){return this.nodesHandler.storePositions.apply(this.nodesHandler,arguments)},AT.prototype.moveNode=function(){return this.nodesHandler.moveNode.apply(this.nodesHandler,arguments)},AT.prototype.getBoundingBox=function(){return this.nodesHandler.getBoundingBox.apply(this.nodesHandler,arguments)},AT.prototype.getConnectedNodes=function(t){return void 0!==this.body.nodes[t]?this.nodesHandler.getConnectedNodes.apply(this.nodesHandler,arguments):this.edgesHandler.getConnectedNodes.apply(this.edgesHandler,arguments)},AT.prototype.getConnectedEdges=function(){return this.nodesHandler.getConnectedEdges.apply(this.nodesHandler,arguments)},AT.prototype.startSimulation=function(){return this.physics.startSimulation.apply(this.physics,arguments)},AT.prototype.stopSimulation=function(){return this.physics.stopSimulation.apply(this.physics,arguments)},AT.prototype.stabilize=function(){return this.physics.stabilize.apply(this.physics,arguments)},AT.prototype.getSelection=function(){return this.selectionHandler.getSelection.apply(this.selectionHandler,arguments)},AT.prototype.setSelection=function(){return this.selectionHandler.setSelection.apply(this.selectionHandler,arguments)},AT.prototype.getSelectedNodes=function(){return this.selectionHandler.getSelectedNodes.apply(this.selectionHandler,arguments)},AT.prototype.getSelectedEdges=function(){return this.selectionHandler.getSelectedEdges.apply(this.selectionHandler,arguments)},AT.prototype.getNodeAt=function(){var t=this.selectionHandler.getNodeAt.apply(this.selectionHandler,arguments);return void 0!==t&&void 0!==t.id?t.id:t},AT.prototype.getEdgeAt=function(){var t=this.selectionHandler.getEdgeAt.apply(this.selectionHandler,arguments);return void 0!==t&&void 0!==t.id?t.id:t},AT.prototype.selectNodes=function(){return this.selectionHandler.selectNodes.apply(this.selectionHandler,arguments)},AT.prototype.selectEdges=function(){return this.selectionHandler.selectEdges.apply(this.selectionHandler,arguments)},AT.prototype.unselectAll=function(){this.selectionHandler.unselectAll.apply(this.selectionHandler,arguments),this.redraw();},AT.prototype.redraw=function(){return this.renderer.redraw.apply(this.renderer,arguments)},AT.prototype.getScale=function(){return this.view.getScale.apply(this.view,arguments)},AT.prototype.getViewPosition=function(){return this.view.getViewPosition.apply(this.view,arguments)},AT.prototype.fit=function(){return this.view.fit.apply(this.view,arguments)},AT.prototype.moveTo=function(){return this.view.moveTo.apply(this.view,arguments)},AT.prototype.focus=function(){return this.view.focus.apply(this.view,arguments)},AT.prototype.releaseNode=function(){return this.view.releaseNode.apply(this.view,arguments)},AT.prototype.getOptionsFromConfigurator=function(){var t={};return this.configurator&&(t=this.configurator.getOptions.apply(this.configurator)),t};var IT=i((function(t,e){e.prepareElements=function(t){for(var e in t)t.hasOwnProperty(e)&&(t[e].redundant=t[e].used,t[e].used=[]);},e.cleanupElements=function(t){for(var e in t)if(t.hasOwnProperty(e)&&t[e].redundant){for(var i=0;i<t[e].redundant.length;i++)t[e].redundant[i].parentNode.removeChild(t[e].redundant[i]);t[e].redundant=[];}},e.resetElements=function(t){e.prepareElements(t),e.cleanupElements(t),e.prepareElements(t);},e.getSVGElement=function(t,e,i){var n;return e.hasOwnProperty(t)?e[t].redundant.length>0?(n=e[t].redundant[0],e[t].redundant.shift()):(n=document.createElementNS("http://www.w3.org/2000/svg",t),i.appendChild(n)):(n=document.createElementNS("http://www.w3.org/2000/svg",t),e[t]={used:[],redundant:[]},i.appendChild(n)),e[t].used.push(n),n},e.getDOMElement=function(t,e,i,n){var o;return e.hasOwnProperty(t)?e[t].redundant.length>0?(o=e[t].redundant[0],e[t].redundant.shift()):(o=document.createElement(t),void 0!==n?i.insertBefore(o,n):i.appendChild(o)):(o=document.createElement(t),e[t]={used:[],redundant:[]},void 0!==n?i.insertBefore(o,n):i.appendChild(o)),e[t].used.push(o),o},e.drawPoint=function(t,i,n,o,r,s){var a;if("circle"==n.style?((a=e.getSVGElement("circle",o,r)).setAttributeNS(null,"cx",t),a.setAttributeNS(null,"cy",i),a.setAttributeNS(null,"r",.5*n.size)):((a=e.getSVGElement("rect",o,r)).setAttributeNS(null,"x",t-.5*n.size),a.setAttributeNS(null,"y",i-.5*n.size),a.setAttributeNS(null,"width",n.size),a.setAttributeNS(null,"height",n.size)),void 0!==n.styles&&a.setAttributeNS(null,"style",n.styles),a.setAttributeNS(null,"class",n.className+" vis-point"),s){var h=e.getSVGElement("text",o,r);s.xOffset&&(t+=s.xOffset),s.yOffset&&(i+=s.yOffset),s.content&&(h.textContent=s.content),s.className&&h.setAttributeNS(null,"class",s.className+" vis-label"),h.setAttributeNS(null,"x",t),h.setAttributeNS(null,"y",i);}return a},e.drawBar=function(t,i,n,o,r,s,a,h){if(0!=o){o<0&&(i-=o*=-1);var l=e.getSVGElement("rect",s,a);l.setAttributeNS(null,"x",t-.5*n),l.setAttributeNS(null,"y",i),l.setAttributeNS(null,"width",n),l.setAttributeNS(null,"height",o),l.setAttributeNS(null,"class",r),h&&l.setAttributeNS(null,"style",h);}};})),FT=IT.prepareElements,NT=IT.cleanupElements,jT=IT.resetElements,zT=IT.getSVGElement,LT=IT.getDOMElement,RT=IT.drawPoint,BT=IT.drawBar,YT=Object.freeze({__proto__:null,default:IT,__moduleExports:IT,prepareElements:FT,cleanupElements:NT,resetElements:jT,getSVGElement:zT,getDOMElement:LT,drawPoint:RT,drawBar:BT}),HT=i((function(t,i){t.exports=function(){var i,n;function o(){return i.apply(null,arguments)}function r(t){return t instanceof Array||"[object Array]"===Object.prototype.toString.call(t)}function s(t){return null!=t&&"[object Object]"===Object.prototype.toString.call(t)}function a(t){return void 0===t}function h(t){return "number"==typeof t||"[object Number]"===Object.prototype.toString.call(t)}function l(t){return t instanceof Date||"[object Date]"===Object.prototype.toString.call(t)}function d(t,e){var i,n=[];for(i=0;i<t.length;++i)n.push(e(t[i],i));return n}function u(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function c(t,e){for(var i in e)u(e,i)&&(t[i]=e[i]);return u(e,"toString")&&(t.toString=e.toString),u(e,"valueOf")&&(t.valueOf=e.valueOf),t}function f(t,e,i,n){return Ie(t,e,i,n,!0).utc()}function p(t){return null==t._pf&&(t._pf={empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1,parsedDateParts:[],meridiem:null,rfc2822:!1,weekdayMismatch:!1}),t._pf}function v(t){if(null==t._isValid){var e=p(t),i=n.call(e.parsedDateParts,(function(t){return null!=t})),o=!isNaN(t._d.getTime())&&e.overflow<0&&!e.empty&&!e.invalidMonth&&!e.invalidWeekday&&!e.weekdayMismatch&&!e.nullInput&&!e.invalidFormat&&!e.userInvalidated&&(!e.meridiem||e.meridiem&&i);if(t._strict&&(o=o&&0===e.charsLeftOver&&0===e.unusedTokens.length&&void 0===e.bigHour),null!=Object.isFrozen&&Object.isFrozen(t))return o;t._isValid=o;}return t._isValid}function y(t){var e=f(NaN);return null!=t?c(p(e),t):p(e).userInvalidated=!0,e}n=Array.prototype.some?Array.prototype.some:function(t){for(var e=Object(this),i=e.length>>>0,n=0;n<i;n++)if(n in e&&t.call(this,e[n],n,e))return !0;return !1};var g=o.momentProperties=[];function m(t,e){var i,n,o;if(a(e._isAMomentObject)||(t._isAMomentObject=e._isAMomentObject),a(e._i)||(t._i=e._i),a(e._f)||(t._f=e._f),a(e._l)||(t._l=e._l),a(e._strict)||(t._strict=e._strict),a(e._tzm)||(t._tzm=e._tzm),a(e._isUTC)||(t._isUTC=e._isUTC),a(e._offset)||(t._offset=e._offset),a(e._pf)||(t._pf=p(e)),a(e._locale)||(t._locale=e._locale),g.length>0)for(i=0;i<g.length;i++)a(o=e[n=g[i]])||(t[n]=o);return t}var b=!1;function w(t){m(this,t),this._d=new Date(null!=t._d?t._d.getTime():NaN),this.isValid()||(this._d=new Date(NaN)),!1===b&&(b=!0,o.updateOffset(this),b=!1);}function _(t){return t instanceof w||null!=t&&null!=t._isAMomentObject}function k(t){return t<0?Math.ceil(t)||0:Math.floor(t)}function x(t){var e=+t,i=0;return 0!==e&&isFinite(e)&&(i=k(e)),i}function O(t,e,i){var n,o=Math.min(t.length,e.length),r=Math.abs(t.length-e.length),s=0;for(n=0;n<o;n++)(i&&t[n]!==e[n]||!i&&x(t[n])!==x(e[n]))&&s++;return s+r}function S(t){!1===o.suppressDeprecationWarnings&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+t);}function M(t,e){var i=!0;return c((function(){if(null!=o.deprecationHandler&&o.deprecationHandler(null,t),i){for(var n,r=[],s=0;s<arguments.length;s++){if(n="","object"==typeof arguments[s]){for(var a in n+="\n["+s+"] ",arguments[0])n+=a+": "+arguments[0][a]+", ";n=n.slice(0,-2);}else n=arguments[s];r.push(n);}S(t+"\nArguments: "+Array.prototype.slice.call(r).join("")+"\n"+(new Error).stack),i=!1;}return e.apply(this,arguments)}),e)}var E,D={};function T(t,e){null!=o.deprecationHandler&&o.deprecationHandler(t,e),D[t]||(S(e),D[t]=!0);}function C(t){return t instanceof Function||"[object Function]"===Object.prototype.toString.call(t)}function P(t,e){var i,n=c({},t);for(i in e)u(e,i)&&(s(t[i])&&s(e[i])?(n[i]={},c(n[i],t[i]),c(n[i],e[i])):null!=e[i]?n[i]=e[i]:delete n[i]);for(i in t)u(t,i)&&!u(e,i)&&s(t[i])&&(n[i]=c({},n[i]));return n}function A(t){null!=t&&this.set(t);}o.suppressDeprecationWarnings=!1,o.deprecationHandler=null,E=Object.keys?Object.keys:function(t){var e,i=[];for(e in t)u(t,e)&&i.push(e);return i};var I={};function F(t,e){var i=t.toLowerCase();I[i]=I[i+"s"]=I[e]=t;}function N(t){return "string"==typeof t?I[t]||I[t.toLowerCase()]:void 0}function j(t){var e,i,n={};for(i in t)u(t,i)&&(e=N(i))&&(n[e]=t[i]);return n}var z={};function L(t,e){z[t]=e;}function R(t,e,i){var n=""+Math.abs(t),o=e-n.length;return (t>=0?i?"+":"":"-")+Math.pow(10,Math.max(0,o)).toString().substr(1)+n}var B=/(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,Y=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,H={},W={};function V(t,e,i,n){var o=n;"string"==typeof n&&(o=function(){return this[n]()}),t&&(W[t]=o),e&&(W[e[0]]=function(){return R(o.apply(this,arguments),e[1],e[2])}),i&&(W[i]=function(){return this.localeData().ordinal(o.apply(this,arguments),t)});}function U(t,e){return t.isValid()?(e=G(e,t.localeData()),H[e]=H[e]||function(t){var e,i,n,o=t.match(B);for(e=0,i=o.length;e<i;e++)W[o[e]]?o[e]=W[o[e]]:o[e]=(n=o[e]).match(/\[[\s\S]/)?n.replace(/^\[|\]$/g,""):n.replace(/\\/g,"");return function(e){var n,r="";for(n=0;n<i;n++)r+=C(o[n])?o[n].call(e,t):o[n];return r}}(e),H[e](t)):t.localeData().invalidDate()}function G(t,e){var i=5;function n(t){return e.longDateFormat(t)||t}for(Y.lastIndex=0;i>=0&&Y.test(t);)t=t.replace(Y,n),Y.lastIndex=0,i-=1;return t}var q=/\d/,X=/\d\d/,Z=/\d{3}/,K=/\d{4}/,$=/[+-]?\d{6}/,J=/\d\d?/,Q=/\d\d\d\d?/,tt=/\d\d\d\d\d\d?/,et=/\d{1,3}/,it=/\d{1,4}/,nt=/[+-]?\d{1,6}/,ot=/\d+/,rt=/[+-]?\d+/,st=/Z|[+-]\d\d:?\d\d/gi,at=/Z|[+-]\d\d(?::?\d\d)?/gi,ht=/[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,lt={};function dt(t,e,i){lt[t]=C(e)?e:function(t,n){return t&&i?i:e};}function ut(t,e){return u(lt,t)?lt[t](e._strict,e._locale):new RegExp(ct(t.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,(function(t,e,i,n,o){return e||i||n||o}))))}function ct(t){return t.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}var ft={};function pt(t,e){var i,n=e;for("string"==typeof t&&(t=[t]),h(e)&&(n=function(t,i){i[e]=x(t);}),i=0;i<t.length;i++)ft[t[i]]=n;}function vt(t,e){pt(t,(function(t,i,n,o){n._w=n._w||{},e(t,n._w,n,o);}));}function yt(t,e,i){null!=e&&u(ft,t)&&ft[t](e,i._a,i,t);}var gt=0,mt=1,bt=2,wt=3,_t=4,kt=5,xt=6,Ot=7,St=8;function Mt(t){return Et(t)?366:365}function Et(t){return t%4==0&&t%100!=0||t%400==0}V("Y",0,0,(function(){var t=this.year();return t<=9999?""+t:"+"+t})),V(0,["YY",2],0,(function(){return this.year()%100})),V(0,["YYYY",4],0,"year"),V(0,["YYYYY",5],0,"year"),V(0,["YYYYYY",6,!0],0,"year"),F("year","y"),L("year",1),dt("Y",rt),dt("YY",J,X),dt("YYYY",it,K),dt("YYYYY",nt,$),dt("YYYYYY",nt,$),pt(["YYYYY","YYYYYY"],gt),pt("YYYY",(function(t,e){e[gt]=2===t.length?o.parseTwoDigitYear(t):x(t);})),pt("YY",(function(t,e){e[gt]=o.parseTwoDigitYear(t);})),pt("Y",(function(t,e){e[gt]=parseInt(t,10);})),o.parseTwoDigitYear=function(t){return x(t)+(x(t)>68?1900:2e3)};var Dt,Tt=Ct("FullYear",!0);function Ct(t,e){return function(i){return null!=i?(At(this,t,i),o.updateOffset(this,e),this):Pt(this,t)}}function Pt(t,e){return t.isValid()?t._d["get"+(t._isUTC?"UTC":"")+e]():NaN}function At(t,e,i){t.isValid()&&!isNaN(i)&&("FullYear"===e&&Et(t.year())&&1===t.month()&&29===t.date()?t._d["set"+(t._isUTC?"UTC":"")+e](i,t.month(),It(i,t.month())):t._d["set"+(t._isUTC?"UTC":"")+e](i));}function It(t,e){if(isNaN(t)||isNaN(e))return NaN;var i=function(t,e){return (t%e+e)%e}(e,12);return t+=(e-i)/12,1===i?Et(t)?29:28:31-i%7%2}Dt=Array.prototype.indexOf?Array.prototype.indexOf:function(t){var e;for(e=0;e<this.length;++e)if(this[e]===t)return e;return -1},V("M",["MM",2],"Mo",(function(){return this.month()+1})),V("MMM",0,0,(function(t){return this.localeData().monthsShort(this,t)})),V("MMMM",0,0,(function(t){return this.localeData().months(this,t)})),F("month","M"),L("month",8),dt("M",J),dt("MM",J,X),dt("MMM",(function(t,e){return e.monthsShortRegex(t)})),dt("MMMM",(function(t,e){return e.monthsRegex(t)})),pt(["M","MM"],(function(t,e){e[mt]=x(t)-1;})),pt(["MMM","MMMM"],(function(t,e,i,n){var o=i._locale.monthsParse(t,n,i._strict);null!=o?e[mt]=o:p(i).invalidMonth=t;}));var Ft=/D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,Nt="January_February_March_April_May_June_July_August_September_October_November_December".split("_"),jt="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");function zt(t,e,i){var n,o,r,s=t.toLocaleLowerCase();if(!this._monthsParse)for(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[],n=0;n<12;++n)r=f([2e3,n]),this._shortMonthsParse[n]=this.monthsShort(r,"").toLocaleLowerCase(),this._longMonthsParse[n]=this.months(r,"").toLocaleLowerCase();return i?"MMM"===e?-1!==(o=Dt.call(this._shortMonthsParse,s))?o:null:-1!==(o=Dt.call(this._longMonthsParse,s))?o:null:"MMM"===e?-1!==(o=Dt.call(this._shortMonthsParse,s))?o:-1!==(o=Dt.call(this._longMonthsParse,s))?o:null:-1!==(o=Dt.call(this._longMonthsParse,s))?o:-1!==(o=Dt.call(this._shortMonthsParse,s))?o:null}function Lt(t,e){var i;if(!t.isValid())return t;if("string"==typeof e)if(/^\d+$/.test(e))e=x(e);else if(!h(e=t.localeData().monthsParse(e)))return t;return i=Math.min(t.date(),It(t.year(),e)),t._d["set"+(t._isUTC?"UTC":"")+"Month"](e,i),t}function Rt(t){return null!=t?(Lt(this,t),o.updateOffset(this,!0),this):Pt(this,"Month")}var Bt=ht,Yt=ht;function Ht(){function t(t,e){return e.length-t.length}var e,i,n=[],o=[],r=[];for(e=0;e<12;e++)i=f([2e3,e]),n.push(this.monthsShort(i,"")),o.push(this.months(i,"")),r.push(this.months(i,"")),r.push(this.monthsShort(i,""));for(n.sort(t),o.sort(t),r.sort(t),e=0;e<12;e++)n[e]=ct(n[e]),o[e]=ct(o[e]);for(e=0;e<24;e++)r[e]=ct(r[e]);this._monthsRegex=new RegExp("^("+r.join("|")+")","i"),this._monthsShortRegex=this._monthsRegex,this._monthsStrictRegex=new RegExp("^("+o.join("|")+")","i"),this._monthsShortStrictRegex=new RegExp("^("+n.join("|")+")","i");}function Wt(t,e,i,n,o,r,s){var a;return t<100&&t>=0?(a=new Date(t+400,e,i,n,o,r,s),isFinite(a.getFullYear())&&a.setFullYear(t)):a=new Date(t,e,i,n,o,r,s),a}function Vt(t){var e;if(t<100&&t>=0){var i=Array.prototype.slice.call(arguments);i[0]=t+400,e=new Date(Date.UTC.apply(null,i)),isFinite(e.getUTCFullYear())&&e.setUTCFullYear(t);}else e=new Date(Date.UTC.apply(null,arguments));return e}function Ut(t,e,i){var n=7+e-i;return -(7+Vt(t,0,n).getUTCDay()-e)%7+n-1}function Gt(t,e,i,n,o){var r,s,a=1+7*(e-1)+(7+i-n)%7+Ut(t,n,o);return a<=0?s=Mt(r=t-1)+a:a>Mt(t)?(r=t+1,s=a-Mt(t)):(r=t,s=a),{year:r,dayOfYear:s}}function qt(t,e,i){var n,o,r=Ut(t.year(),e,i),s=Math.floor((t.dayOfYear()-r-1)/7)+1;return s<1?n=s+Xt(o=t.year()-1,e,i):s>Xt(t.year(),e,i)?(n=s-Xt(t.year(),e,i),o=t.year()+1):(o=t.year(),n=s),{week:n,year:o}}function Xt(t,e,i){var n=Ut(t,e,i),o=Ut(t+1,e,i);return (Mt(t)-n+o)/7}function Zt(t,e){return t.slice(e,7).concat(t.slice(0,e))}V("w",["ww",2],"wo","week"),V("W",["WW",2],"Wo","isoWeek"),F("week","w"),F("isoWeek","W"),L("week",5),L("isoWeek",5),dt("w",J),dt("ww",J,X),dt("W",J),dt("WW",J,X),vt(["w","ww","W","WW"],(function(t,e,i,n){e[n.substr(0,1)]=x(t);})),V("d",0,"do","day"),V("dd",0,0,(function(t){return this.localeData().weekdaysMin(this,t)})),V("ddd",0,0,(function(t){return this.localeData().weekdaysShort(this,t)})),V("dddd",0,0,(function(t){return this.localeData().weekdays(this,t)})),V("e",0,0,"weekday"),V("E",0,0,"isoWeekday"),F("day","d"),F("weekday","e"),F("isoWeekday","E"),L("day",11),L("weekday",11),L("isoWeekday",11),dt("d",J),dt("e",J),dt("E",J),dt("dd",(function(t,e){return e.weekdaysMinRegex(t)})),dt("ddd",(function(t,e){return e.weekdaysShortRegex(t)})),dt("dddd",(function(t,e){return e.weekdaysRegex(t)})),vt(["dd","ddd","dddd"],(function(t,e,i,n){var o=i._locale.weekdaysParse(t,n,i._strict);null!=o?e.d=o:p(i).invalidWeekday=t;})),vt(["d","e","E"],(function(t,e,i,n){e[n]=x(t);}));var Kt="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),$t="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),Jt="Su_Mo_Tu_We_Th_Fr_Sa".split("_");function Qt(t,e,i){var n,o,r,s=t.toLocaleLowerCase();if(!this._weekdaysParse)for(this._weekdaysParse=[],this._shortWeekdaysParse=[],this._minWeekdaysParse=[],n=0;n<7;++n)r=f([2e3,1]).day(n),this._minWeekdaysParse[n]=this.weekdaysMin(r,"").toLocaleLowerCase(),this._shortWeekdaysParse[n]=this.weekdaysShort(r,"").toLocaleLowerCase(),this._weekdaysParse[n]=this.weekdays(r,"").toLocaleLowerCase();return i?"dddd"===e?-1!==(o=Dt.call(this._weekdaysParse,s))?o:null:"ddd"===e?-1!==(o=Dt.call(this._shortWeekdaysParse,s))?o:null:-1!==(o=Dt.call(this._minWeekdaysParse,s))?o:null:"dddd"===e?-1!==(o=Dt.call(this._weekdaysParse,s))?o:-1!==(o=Dt.call(this._shortWeekdaysParse,s))?o:-1!==(o=Dt.call(this._minWeekdaysParse,s))?o:null:"ddd"===e?-1!==(o=Dt.call(this._shortWeekdaysParse,s))?o:-1!==(o=Dt.call(this._weekdaysParse,s))?o:-1!==(o=Dt.call(this._minWeekdaysParse,s))?o:null:-1!==(o=Dt.call(this._minWeekdaysParse,s))?o:-1!==(o=Dt.call(this._weekdaysParse,s))?o:-1!==(o=Dt.call(this._shortWeekdaysParse,s))?o:null}var te=ht,ee=ht,ie=ht;function ne(){function t(t,e){return e.length-t.length}var e,i,n,o,r,s=[],a=[],h=[],l=[];for(e=0;e<7;e++)i=f([2e3,1]).day(e),n=this.weekdaysMin(i,""),o=this.weekdaysShort(i,""),r=this.weekdays(i,""),s.push(n),a.push(o),h.push(r),l.push(n),l.push(o),l.push(r);for(s.sort(t),a.sort(t),h.sort(t),l.sort(t),e=0;e<7;e++)a[e]=ct(a[e]),h[e]=ct(h[e]),l[e]=ct(l[e]);this._weekdaysRegex=new RegExp("^("+l.join("|")+")","i"),this._weekdaysShortRegex=this._weekdaysRegex,this._weekdaysMinRegex=this._weekdaysRegex,this._weekdaysStrictRegex=new RegExp("^("+h.join("|")+")","i"),this._weekdaysShortStrictRegex=new RegExp("^("+a.join("|")+")","i"),this._weekdaysMinStrictRegex=new RegExp("^("+s.join("|")+")","i");}function oe(){return this.hours()%12||12}function re(t,e){V(t,0,0,(function(){return this.localeData().meridiem(this.hours(),this.minutes(),e)}));}function se(t,e){return e._meridiemParse}V("H",["HH",2],0,"hour"),V("h",["hh",2],0,oe),V("k",["kk",2],0,(function(){return this.hours()||24})),V("hmm",0,0,(function(){return ""+oe.apply(this)+R(this.minutes(),2)})),V("hmmss",0,0,(function(){return ""+oe.apply(this)+R(this.minutes(),2)+R(this.seconds(),2)})),V("Hmm",0,0,(function(){return ""+this.hours()+R(this.minutes(),2)})),V("Hmmss",0,0,(function(){return ""+this.hours()+R(this.minutes(),2)+R(this.seconds(),2)})),re("a",!0),re("A",!1),F("hour","h"),L("hour",13),dt("a",se),dt("A",se),dt("H",J),dt("h",J),dt("k",J),dt("HH",J,X),dt("hh",J,X),dt("kk",J,X),dt("hmm",Q),dt("hmmss",tt),dt("Hmm",Q),dt("Hmmss",tt),pt(["H","HH"],wt),pt(["k","kk"],(function(t,e,i){var n=x(t);e[wt]=24===n?0:n;})),pt(["a","A"],(function(t,e,i){i._isPm=i._locale.isPM(t),i._meridiem=t;})),pt(["h","hh"],(function(t,e,i){e[wt]=x(t),p(i).bigHour=!0;})),pt("hmm",(function(t,e,i){var n=t.length-2;e[wt]=x(t.substr(0,n)),e[_t]=x(t.substr(n)),p(i).bigHour=!0;})),pt("hmmss",(function(t,e,i){var n=t.length-4,o=t.length-2;e[wt]=x(t.substr(0,n)),e[_t]=x(t.substr(n,2)),e[kt]=x(t.substr(o)),p(i).bigHour=!0;})),pt("Hmm",(function(t,e,i){var n=t.length-2;e[wt]=x(t.substr(0,n)),e[_t]=x(t.substr(n));})),pt("Hmmss",(function(t,e,i){var n=t.length-4,o=t.length-2;e[wt]=x(t.substr(0,n)),e[_t]=x(t.substr(n,2)),e[kt]=x(t.substr(o));}));var ae,he=Ct("Hours",!0),le={calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},longDateFormat:{LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},invalidDate:"Invalid date",ordinal:"%d",dayOfMonthOrdinalParse:/\d{1,2}/,relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",ss:"%d seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},months:Nt,monthsShort:jt,week:{dow:0,doy:6},weekdays:Kt,weekdaysMin:Jt,weekdaysShort:$t,meridiemParse:/[ap]\.?m?\.?/i},de={},ue={};function ce(t){return t?t.toLowerCase().replace("_","-"):t}function fe(i){var n=null;if(!de[i]&&t&&t.exports)try{n=ae._abbr,e(),pe(n);}catch(t){}return de[i]}function pe(t,e){var i;return t&&((i=a(e)?ye(t):ve(t,e))?ae=i:"undefined"!=typeof console&&console.warn&&console.warn("Locale "+t+" not found. Did you forget to load it?")),ae._abbr}function ve(t,e){if(null!==e){var i,n=le;if(e.abbr=t,null!=de[t])T("defineLocaleOverride","use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."),n=de[t]._config;else if(null!=e.parentLocale)if(null!=de[e.parentLocale])n=de[e.parentLocale]._config;else{if(null==(i=fe(e.parentLocale)))return ue[e.parentLocale]||(ue[e.parentLocale]=[]),ue[e.parentLocale].push({name:t,config:e}),null;n=i._config;}return de[t]=new A(P(n,e)),ue[t]&&ue[t].forEach((function(t){ve(t.name,t.config);})),pe(t),de[t]}return delete de[t],null}function ye(t){var e;if(t&&t._locale&&t._locale._abbr&&(t=t._locale._abbr),!t)return ae;if(!r(t)){if(e=fe(t))return e;t=[t];}return function(t){for(var e,i,n,o,r=0;r<t.length;){for(e=(o=ce(t[r]).split("-")).length,i=(i=ce(t[r+1]))?i.split("-"):null;e>0;){if(n=fe(o.slice(0,e).join("-")))return n;if(i&&i.length>=e&&O(o,i,!0)>=e-1)break;e--;}r++;}return ae}(t)}function ge(t){var e,i=t._a;return i&&-2===p(t).overflow&&(e=i[mt]<0||i[mt]>11?mt:i[bt]<1||i[bt]>It(i[gt],i[mt])?bt:i[wt]<0||i[wt]>24||24===i[wt]&&(0!==i[_t]||0!==i[kt]||0!==i[xt])?wt:i[_t]<0||i[_t]>59?_t:i[kt]<0||i[kt]>59?kt:i[xt]<0||i[xt]>999?xt:-1,p(t)._overflowDayOfYear&&(e<gt||e>bt)&&(e=bt),p(t)._overflowWeeks&&-1===e&&(e=Ot),p(t)._overflowWeekday&&-1===e&&(e=St),p(t).overflow=e),t}function me(t,e,i){return null!=t?t:null!=e?e:i}function be(t){var e,i,n,r,s,a=[];if(!t._d){for(n=function(t){var e=new Date(o.now());return t._useUTC?[e.getUTCFullYear(),e.getUTCMonth(),e.getUTCDate()]:[e.getFullYear(),e.getMonth(),e.getDate()]}(t),t._w&&null==t._a[bt]&&null==t._a[mt]&&function(t){var e,i,n,o,r,s,a,h;if(null!=(e=t._w).GG||null!=e.W||null!=e.E)r=1,s=4,i=me(e.GG,t._a[gt],qt(Fe(),1,4).year),n=me(e.W,1),((o=me(e.E,1))<1||o>7)&&(h=!0);else{r=t._locale._week.dow,s=t._locale._week.doy;var l=qt(Fe(),r,s);i=me(e.gg,t._a[gt],l.year),n=me(e.w,l.week),null!=e.d?((o=e.d)<0||o>6)&&(h=!0):null!=e.e?(o=e.e+r,(e.e<0||e.e>6)&&(h=!0)):o=r;}n<1||n>Xt(i,r,s)?p(t)._overflowWeeks=!0:null!=h?p(t)._overflowWeekday=!0:(a=Gt(i,n,o,r,s),t._a[gt]=a.year,t._dayOfYear=a.dayOfYear);}(t),null!=t._dayOfYear&&(s=me(t._a[gt],n[gt]),(t._dayOfYear>Mt(s)||0===t._dayOfYear)&&(p(t)._overflowDayOfYear=!0),i=Vt(s,0,t._dayOfYear),t._a[mt]=i.getUTCMonth(),t._a[bt]=i.getUTCDate()),e=0;e<3&&null==t._a[e];++e)t._a[e]=a[e]=n[e];for(;e<7;e++)t._a[e]=a[e]=null==t._a[e]?2===e?1:0:t._a[e];24===t._a[wt]&&0===t._a[_t]&&0===t._a[kt]&&0===t._a[xt]&&(t._nextDay=!0,t._a[wt]=0),t._d=(t._useUTC?Vt:Wt).apply(null,a),r=t._useUTC?t._d.getUTCDay():t._d.getDay(),null!=t._tzm&&t._d.setUTCMinutes(t._d.getUTCMinutes()-t._tzm),t._nextDay&&(t._a[wt]=24),t._w&&void 0!==t._w.d&&t._w.d!==r&&(p(t).weekdayMismatch=!0);}}var we=/^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,_e=/^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,ke=/Z|[+-]\d\d(?::?\d\d)?/,xe=[["YYYYYY-MM-DD",/[+-]\d{6}-\d\d-\d\d/],["YYYY-MM-DD",/\d{4}-\d\d-\d\d/],["GGGG-[W]WW-E",/\d{4}-W\d\d-\d/],["GGGG-[W]WW",/\d{4}-W\d\d/,!1],["YYYY-DDD",/\d{4}-\d{3}/],["YYYY-MM",/\d{4}-\d\d/,!1],["YYYYYYMMDD",/[+-]\d{10}/],["YYYYMMDD",/\d{8}/],["GGGG[W]WWE",/\d{4}W\d{3}/],["GGGG[W]WW",/\d{4}W\d{2}/,!1],["YYYYDDD",/\d{7}/]],Oe=[["HH:mm:ss.SSSS",/\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss,SSSS",/\d\d:\d\d:\d\d,\d+/],["HH:mm:ss",/\d\d:\d\d:\d\d/],["HH:mm",/\d\d:\d\d/],["HHmmss.SSSS",/\d\d\d\d\d\d\.\d+/],["HHmmss,SSSS",/\d\d\d\d\d\d,\d+/],["HHmmss",/\d\d\d\d\d\d/],["HHmm",/\d\d\d\d/],["HH",/\d\d/]],Se=/^\/?Date\((\-?\d+)/i;function Me(t){var e,i,n,o,r,s,a=t._i,h=we.exec(a)||_e.exec(a);if(h){for(p(t).iso=!0,e=0,i=xe.length;e<i;e++)if(xe[e][1].exec(h[1])){o=xe[e][0],n=!1!==xe[e][2];break}if(null==o)return void(t._isValid=!1);if(h[3]){for(e=0,i=Oe.length;e<i;e++)if(Oe[e][1].exec(h[3])){r=(h[2]||" ")+Oe[e][0];break}if(null==r)return void(t._isValid=!1)}if(!n&&null!=r)return void(t._isValid=!1);if(h[4]){if(!ke.exec(h[4]))return void(t._isValid=!1);s="Z";}t._f=o+(r||"")+(s||""),Pe(t);}else t._isValid=!1;}var Ee=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;function De(t){var e=parseInt(t,10);return e<=49?2e3+e:e<=999?1900+e:e}var Te={UT:0,GMT:0,EDT:-240,EST:-300,CDT:-300,CST:-360,MDT:-360,MST:-420,PDT:-420,PST:-480};function Ce(t){var e,i,n,o,r,s,a,h=Ee.exec(t._i.replace(/\([^)]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").replace(/^\s\s*/,"").replace(/\s\s*$/,""));if(h){var l=(e=h[4],i=h[3],n=h[2],o=h[5],r=h[6],s=h[7],a=[De(e),jt.indexOf(i),parseInt(n,10),parseInt(o,10),parseInt(r,10)],s&&a.push(parseInt(s,10)),a);if(!function(t,e,i){return !t||$t.indexOf(t)===new Date(e[0],e[1],e[2]).getDay()||(p(i).weekdayMismatch=!0,i._isValid=!1,!1)}(h[1],l,t))return;t._a=l,t._tzm=function(t,e,i){if(t)return Te[t];if(e)return 0;var n=parseInt(i,10),o=n%100;return (n-o)/100*60+o}(h[8],h[9],h[10]),t._d=Vt.apply(null,t._a),t._d.setUTCMinutes(t._d.getUTCMinutes()-t._tzm),p(t).rfc2822=!0;}else t._isValid=!1;}function Pe(t){if(t._f!==o.ISO_8601)if(t._f!==o.RFC_2822){t._a=[],p(t).empty=!0;var e,i,n,r,s,a=""+t._i,h=a.length,l=0;for(n=G(t._f,t._locale).match(B)||[],e=0;e<n.length;e++)r=n[e],(i=(a.match(ut(r,t))||[])[0])&&((s=a.substr(0,a.indexOf(i))).length>0&&p(t).unusedInput.push(s),a=a.slice(a.indexOf(i)+i.length),l+=i.length),W[r]?(i?p(t).empty=!1:p(t).unusedTokens.push(r),yt(r,i,t)):t._strict&&!i&&p(t).unusedTokens.push(r);p(t).charsLeftOver=h-l,a.length>0&&p(t).unusedInput.push(a),t._a[wt]<=12&&!0===p(t).bigHour&&t._a[wt]>0&&(p(t).bigHour=void 0),p(t).parsedDateParts=t._a.slice(0),p(t).meridiem=t._meridiem,t._a[wt]=function(t,e,i){var n;return null==i?e:null!=t.meridiemHour?t.meridiemHour(e,i):null!=t.isPM?((n=t.isPM(i))&&e<12&&(e+=12),n||12!==e||(e=0),e):e}(t._locale,t._a[wt],t._meridiem),be(t),ge(t);}else Ce(t);else Me(t);}function Ae(t){var e=t._i,i=t._f;return t._locale=t._locale||ye(t._l),null===e||void 0===i&&""===e?y({nullInput:!0}):("string"==typeof e&&(t._i=e=t._locale.preparse(e)),_(e)?new w(ge(e)):(l(e)?t._d=e:r(i)?function(t){var e,i,n,o,r;if(0===t._f.length)return p(t).invalidFormat=!0,void(t._d=new Date(NaN));for(o=0;o<t._f.length;o++)r=0,e=m({},t),null!=t._useUTC&&(e._useUTC=t._useUTC),e._f=t._f[o],Pe(e),v(e)&&(r+=p(e).charsLeftOver,r+=10*p(e).unusedTokens.length,p(e).score=r,(null==n||r<n)&&(n=r,i=e));c(t,i||e);}(t):i?Pe(t):function(t){var e=t._i;a(e)?t._d=new Date(o.now()):l(e)?t._d=new Date(e.valueOf()):"string"==typeof e?function(t){var e=Se.exec(t._i);null===e?(Me(t),!1===t._isValid&&(delete t._isValid,Ce(t),!1===t._isValid&&(delete t._isValid,o.createFromInputFallback(t)))):t._d=new Date(+e[1]);}(t):r(e)?(t._a=d(e.slice(0),(function(t){return parseInt(t,10)})),be(t)):s(e)?function(t){if(!t._d){var e=j(t._i);t._a=d([e.year,e.month,e.day||e.date,e.hour,e.minute,e.second,e.millisecond],(function(t){return t&&parseInt(t,10)})),be(t);}}(t):h(e)?t._d=new Date(e):o.createFromInputFallback(t);}(t),v(t)||(t._d=null),t))}function Ie(t,e,i,n,o){var a,h={};return !0!==i&&!1!==i||(n=i,i=void 0),(s(t)&&function(t){if(Object.getOwnPropertyNames)return 0===Object.getOwnPropertyNames(t).length;var e;for(e in t)if(t.hasOwnProperty(e))return !1;return !0}(t)||r(t)&&0===t.length)&&(t=void 0),h._isAMomentObject=!0,h._useUTC=h._isUTC=o,h._l=i,h._i=t,h._f=e,h._strict=n,(a=new w(ge(Ae(h))))._nextDay&&(a.add(1,"d"),a._nextDay=void 0),a}function Fe(t,e,i,n){return Ie(t,e,i,n,!1)}o.createFromInputFallback=M("value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.",(function(t){t._d=new Date(t._i+(t._useUTC?" UTC":""));})),o.ISO_8601=function(){},o.RFC_2822=function(){};var Ne=M("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/",(function(){var t=Fe.apply(null,arguments);return this.isValid()&&t.isValid()?t<this?this:t:y()})),je=M("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/",(function(){var t=Fe.apply(null,arguments);return this.isValid()&&t.isValid()?t>this?this:t:y()}));function ze(t,e){var i,n;if(1===e.length&&r(e[0])&&(e=e[0]),!e.length)return Fe();for(i=e[0],n=1;n<e.length;++n)e[n].isValid()&&!e[n][t](i)||(i=e[n]);return i}var Le=["year","quarter","month","week","day","hour","minute","second","millisecond"];function Re(t){var e=j(t),i=e.year||0,n=e.quarter||0,o=e.month||0,r=e.week||e.isoWeek||0,s=e.day||0,a=e.hour||0,h=e.minute||0,l=e.second||0,d=e.millisecond||0;this._isValid=function(t){for(var e in t)if(-1===Dt.call(Le,e)||null!=t[e]&&isNaN(t[e]))return !1;for(var i=!1,n=0;n<Le.length;++n)if(t[Le[n]]){if(i)return !1;parseFloat(t[Le[n]])!==x(t[Le[n]])&&(i=!0);}return !0}(e),this._milliseconds=+d+1e3*l+6e4*h+1e3*a*60*60,this._days=+s+7*r,this._months=+o+3*n+12*i,this._data={},this._locale=ye(),this._bubble();}function Be(t){return t instanceof Re}function Ye(t){return t<0?-1*Math.round(-1*t):Math.round(t)}function He(t,e){V(t,0,0,(function(){var t=this.utcOffset(),i="+";return t<0&&(t=-t,i="-"),i+R(~~(t/60),2)+e+R(~~t%60,2)}));}He("Z",":"),He("ZZ",""),dt("Z",at),dt("ZZ",at),pt(["Z","ZZ"],(function(t,e,i){i._useUTC=!0,i._tzm=Ve(at,t);}));var We=/([\+\-]|\d\d)/gi;function Ve(t,e){var i=(e||"").match(t);if(null===i)return null;var n=((i[i.length-1]||[])+"").match(We)||["-",0,0],o=60*n[1]+x(n[2]);return 0===o?0:"+"===n[0]?o:-o}function Ue(t,e){var i,n;return e._isUTC?(i=e.clone(),n=(_(t)||l(t)?t.valueOf():Fe(t).valueOf())-i.valueOf(),i._d.setTime(i._d.valueOf()+n),o.updateOffset(i,!1),i):Fe(t).local()}function Ge(t){return 15*-Math.round(t._d.getTimezoneOffset()/15)}function qe(){return !!this.isValid()&&this._isUTC&&0===this._offset}o.updateOffset=function(){};var Xe=/^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/,Ze=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;function Ke(t,e){var i,n,o,r,s,a,l=t,d=null;return Be(t)?l={ms:t._milliseconds,d:t._days,M:t._months}:h(t)?(l={},e?l[e]=t:l.milliseconds=t):(d=Xe.exec(t))?(i="-"===d[1]?-1:1,l={y:0,d:x(d[bt])*i,h:x(d[wt])*i,m:x(d[_t])*i,s:x(d[kt])*i,ms:x(Ye(1e3*d[xt]))*i}):(d=Ze.exec(t))?(i="-"===d[1]?-1:1,l={y:$e(d[2],i),M:$e(d[3],i),w:$e(d[4],i),d:$e(d[5],i),h:$e(d[6],i),m:$e(d[7],i),s:$e(d[8],i)}):null==l?l={}:"object"==typeof l&&("from"in l||"to"in l)&&(r=Fe(l.from),s=Fe(l.to),o=r.isValid()&&s.isValid()?(s=Ue(s,r),r.isBefore(s)?a=Je(r,s):((a=Je(s,r)).milliseconds=-a.milliseconds,a.months=-a.months),a):{milliseconds:0,months:0},(l={}).ms=o.milliseconds,l.M=o.months),n=new Re(l),Be(t)&&u(t,"_locale")&&(n._locale=t._locale),n}function $e(t,e){var i=t&&parseFloat(t.replace(",","."));return (isNaN(i)?0:i)*e}function Je(t,e){var i={};return i.months=e.month()-t.month()+12*(e.year()-t.year()),t.clone().add(i.months,"M").isAfter(e)&&--i.months,i.milliseconds=+e-+t.clone().add(i.months,"M"),i}function Qe(t,e){return function(i,n){var o;return null===n||isNaN(+n)||(T(e,"moment()."+e+"(period, number) is deprecated. Please use moment()."+e+"(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."),o=i,i=n,n=o),ti(this,Ke(i="string"==typeof i?+i:i,n),t),this}}function ti(t,e,i,n){var r=e._milliseconds,s=Ye(e._days),a=Ye(e._months);t.isValid()&&(n=null==n||n,a&&Lt(t,Pt(t,"Month")+a*i),s&&At(t,"Date",Pt(t,"Date")+s*i),r&&t._d.setTime(t._d.valueOf()+r*i),n&&o.updateOffset(t,s||a));}Ke.fn=Re.prototype,Ke.invalid=function(){return Ke(NaN)};var ei=Qe(1,"add"),ii=Qe(-1,"subtract");function ni(t,e){var i=12*(e.year()-t.year())+(e.month()-t.month()),n=t.clone().add(i,"months");return -(i+(e-n<0?(e-n)/(n-t.clone().add(i-1,"months")):(e-n)/(t.clone().add(i+1,"months")-n)))||0}function oi(t){var e;return void 0===t?this._locale._abbr:(null!=(e=ye(t))&&(this._locale=e),this)}o.defaultFormat="YYYY-MM-DDTHH:mm:ssZ",o.defaultFormatUtc="YYYY-MM-DDTHH:mm:ss[Z]";var ri=M("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",(function(t){return void 0===t?this.localeData():this.locale(t)}));function si(){return this._locale}var ai=1e3,hi=60*ai,li=60*hi,di=3506328*li;function ui(t,e){return (t%e+e)%e}function ci(t,e,i){return t<100&&t>=0?new Date(t+400,e,i)-di:new Date(t,e,i).valueOf()}function fi(t,e,i){return t<100&&t>=0?Date.UTC(t+400,e,i)-di:Date.UTC(t,e,i)}function pi(t,e){V(0,[t,t.length],0,e);}function vi(t,e,i,n,o){var r;return null==t?qt(this,n,o).year:(e>(r=Xt(t,n,o))&&(e=r),yi.call(this,t,e,i,n,o))}function yi(t,e,i,n,o){var r=Gt(t,e,i,n,o),s=Vt(r.year,0,r.dayOfYear);return this.year(s.getUTCFullYear()),this.month(s.getUTCMonth()),this.date(s.getUTCDate()),this}V(0,["gg",2],0,(function(){return this.weekYear()%100})),V(0,["GG",2],0,(function(){return this.isoWeekYear()%100})),pi("gggg","weekYear"),pi("ggggg","weekYear"),pi("GGGG","isoWeekYear"),pi("GGGGG","isoWeekYear"),F("weekYear","gg"),F("isoWeekYear","GG"),L("weekYear",1),L("isoWeekYear",1),dt("G",rt),dt("g",rt),dt("GG",J,X),dt("gg",J,X),dt("GGGG",it,K),dt("gggg",it,K),dt("GGGGG",nt,$),dt("ggggg",nt,$),vt(["gggg","ggggg","GGGG","GGGGG"],(function(t,e,i,n){e[n.substr(0,2)]=x(t);})),vt(["gg","GG"],(function(t,e,i,n){e[n]=o.parseTwoDigitYear(t);})),V("Q",0,"Qo","quarter"),F("quarter","Q"),L("quarter",7),dt("Q",q),pt("Q",(function(t,e){e[mt]=3*(x(t)-1);})),V("D",["DD",2],"Do","date"),F("date","D"),L("date",9),dt("D",J),dt("DD",J,X),dt("Do",(function(t,e){return t?e._dayOfMonthOrdinalParse||e._ordinalParse:e._dayOfMonthOrdinalParseLenient})),pt(["D","DD"],bt),pt("Do",(function(t,e){e[bt]=x(t.match(J)[0]);}));var gi=Ct("Date",!0);V("DDD",["DDDD",3],"DDDo","dayOfYear"),F("dayOfYear","DDD"),L("dayOfYear",4),dt("DDD",et),dt("DDDD",Z),pt(["DDD","DDDD"],(function(t,e,i){i._dayOfYear=x(t);})),V("m",["mm",2],0,"minute"),F("minute","m"),L("minute",14),dt("m",J),dt("mm",J,X),pt(["m","mm"],_t);var mi=Ct("Minutes",!1);V("s",["ss",2],0,"second"),F("second","s"),L("second",15),dt("s",J),dt("ss",J,X),pt(["s","ss"],kt);var bi,wi=Ct("Seconds",!1);for(V("S",0,0,(function(){return ~~(this.millisecond()/100)})),V(0,["SS",2],0,(function(){return ~~(this.millisecond()/10)})),V(0,["SSS",3],0,"millisecond"),V(0,["SSSS",4],0,(function(){return 10*this.millisecond()})),V(0,["SSSSS",5],0,(function(){return 100*this.millisecond()})),V(0,["SSSSSS",6],0,(function(){return 1e3*this.millisecond()})),V(0,["SSSSSSS",7],0,(function(){return 1e4*this.millisecond()})),V(0,["SSSSSSSS",8],0,(function(){return 1e5*this.millisecond()})),V(0,["SSSSSSSSS",9],0,(function(){return 1e6*this.millisecond()})),F("millisecond","ms"),L("millisecond",16),dt("S",et,q),dt("SS",et,X),dt("SSS",et,Z),bi="SSSS";bi.length<=9;bi+="S")dt(bi,ot);function _i(t,e){e[xt]=x(1e3*("0."+t));}for(bi="S";bi.length<=9;bi+="S")pt(bi,_i);var ki=Ct("Milliseconds",!1);V("z",0,0,"zoneAbbr"),V("zz",0,0,"zoneName");var xi=w.prototype;function Oi(t){return t}xi.add=ei,xi.calendar=function(t,e){var i=t||Fe(),n=Ue(i,this).startOf("day"),r=o.calendarFormat(this,n)||"sameElse",s=e&&(C(e[r])?e[r].call(this,i):e[r]);return this.format(s||this.localeData().calendar(r,this,Fe(i)))},xi.clone=function(){return new w(this)},xi.diff=function(t,e,i){var n,o,r;if(!this.isValid())return NaN;if(!(n=Ue(t,this)).isValid())return NaN;switch(o=6e4*(n.utcOffset()-this.utcOffset()),e=N(e)){case"year":r=ni(this,n)/12;break;case"month":r=ni(this,n);break;case"quarter":r=ni(this,n)/3;break;case"second":r=(this-n)/1e3;break;case"minute":r=(this-n)/6e4;break;case"hour":r=(this-n)/36e5;break;case"day":r=(this-n-o)/864e5;break;case"week":r=(this-n-o)/6048e5;break;default:r=this-n;}return i?r:k(r)},xi.endOf=function(t){var e;if(void 0===(t=N(t))||"millisecond"===t||!this.isValid())return this;var i=this._isUTC?fi:ci;switch(t){case"year":e=i(this.year()+1,0,1)-1;break;case"quarter":e=i(this.year(),this.month()-this.month()%3+3,1)-1;break;case"month":e=i(this.year(),this.month()+1,1)-1;break;case"week":e=i(this.year(),this.month(),this.date()-this.weekday()+7)-1;break;case"isoWeek":e=i(this.year(),this.month(),this.date()-(this.isoWeekday()-1)+7)-1;break;case"day":case"date":e=i(this.year(),this.month(),this.date()+1)-1;break;case"hour":e=this._d.valueOf(),e+=li-ui(e+(this._isUTC?0:this.utcOffset()*hi),li)-1;break;case"minute":e=this._d.valueOf(),e+=hi-ui(e,hi)-1;break;case"second":e=this._d.valueOf(),e+=ai-ui(e,ai)-1;}return this._d.setTime(e),o.updateOffset(this,!0),this},xi.format=function(t){t||(t=this.isUtc()?o.defaultFormatUtc:o.defaultFormat);var e=U(this,t);return this.localeData().postformat(e)},xi.from=function(t,e){return this.isValid()&&(_(t)&&t.isValid()||Fe(t).isValid())?Ke({to:this,from:t}).locale(this.locale()).humanize(!e):this.localeData().invalidDate()},xi.fromNow=function(t){return this.from(Fe(),t)},xi.to=function(t,e){return this.isValid()&&(_(t)&&t.isValid()||Fe(t).isValid())?Ke({from:this,to:t}).locale(this.locale()).humanize(!e):this.localeData().invalidDate()},xi.toNow=function(t){return this.to(Fe(),t)},xi.get=function(t){return C(this[t=N(t)])?this[t]():this},xi.invalidAt=function(){return p(this).overflow},xi.isAfter=function(t,e){var i=_(t)?t:Fe(t);return !(!this.isValid()||!i.isValid())&&("millisecond"===(e=N(e)||"millisecond")?this.valueOf()>i.valueOf():i.valueOf()<this.clone().startOf(e).valueOf())},xi.isBefore=function(t,e){var i=_(t)?t:Fe(t);return !(!this.isValid()||!i.isValid())&&("millisecond"===(e=N(e)||"millisecond")?this.valueOf()<i.valueOf():this.clone().endOf(e).valueOf()<i.valueOf())},xi.isBetween=function(t,e,i,n){var o=_(t)?t:Fe(t),r=_(e)?e:Fe(e);return !!(this.isValid()&&o.isValid()&&r.isValid())&&("("===(n=n||"()")[0]?this.isAfter(o,i):!this.isBefore(o,i))&&(")"===n[1]?this.isBefore(r,i):!this.isAfter(r,i))},xi.isSame=function(t,e){var i,n=_(t)?t:Fe(t);return !(!this.isValid()||!n.isValid())&&("millisecond"===(e=N(e)||"millisecond")?this.valueOf()===n.valueOf():(i=n.valueOf(),this.clone().startOf(e).valueOf()<=i&&i<=this.clone().endOf(e).valueOf()))},xi.isSameOrAfter=function(t,e){return this.isSame(t,e)||this.isAfter(t,e)},xi.isSameOrBefore=function(t,e){return this.isSame(t,e)||this.isBefore(t,e)},xi.isValid=function(){return v(this)},xi.lang=ri,xi.locale=oi,xi.localeData=si,xi.max=je,xi.min=Ne,xi.parsingFlags=function(){return c({},p(this))},xi.set=function(t,e){if("object"==typeof t)for(var i=function(t){var e=[];for(var i in t)e.push({unit:i,priority:z[i]});return e.sort((function(t,e){return t.priority-e.priority})),e}(t=j(t)),n=0;n<i.length;n++)this[i[n].unit](t[i[n].unit]);else if(C(this[t=N(t)]))return this[t](e);return this},xi.startOf=function(t){var e;if(void 0===(t=N(t))||"millisecond"===t||!this.isValid())return this;var i=this._isUTC?fi:ci;switch(t){case"year":e=i(this.year(),0,1);break;case"quarter":e=i(this.year(),this.month()-this.month()%3,1);break;case"month":e=i(this.year(),this.month(),1);break;case"week":e=i(this.year(),this.month(),this.date()-this.weekday());break;case"isoWeek":e=i(this.year(),this.month(),this.date()-(this.isoWeekday()-1));break;case"day":case"date":e=i(this.year(),this.month(),this.date());break;case"hour":e=this._d.valueOf(),e-=ui(e+(this._isUTC?0:this.utcOffset()*hi),li);break;case"minute":e=this._d.valueOf(),e-=ui(e,hi);break;case"second":e=this._d.valueOf(),e-=ui(e,ai);}return this._d.setTime(e),o.updateOffset(this,!0),this},xi.subtract=ii,xi.toArray=function(){var t=this;return [t.year(),t.month(),t.date(),t.hour(),t.minute(),t.second(),t.millisecond()]},xi.toObject=function(){var t=this;return {years:t.year(),months:t.month(),date:t.date(),hours:t.hours(),minutes:t.minutes(),seconds:t.seconds(),milliseconds:t.milliseconds()}},xi.toDate=function(){return new Date(this.valueOf())},xi.toISOString=function(t){if(!this.isValid())return null;var e=!0!==t,i=e?this.clone().utc():this;return i.year()<0||i.year()>9999?U(i,e?"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYYYY-MM-DD[T]HH:mm:ss.SSSZ"):C(Date.prototype.toISOString)?e?this.toDate().toISOString():new Date(this.valueOf()+60*this.utcOffset()*1e3).toISOString().replace("Z",U(i,"Z")):U(i,e?"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYY-MM-DD[T]HH:mm:ss.SSSZ")},xi.inspect=function(){if(!this.isValid())return "moment.invalid(/* "+this._i+" */)";var t="moment",e="";this.isLocal()||(t=0===this.utcOffset()?"moment.utc":"moment.parseZone",e="Z");var i="["+t+'("]',n=0<=this.year()&&this.year()<=9999?"YYYY":"YYYYYY",o=e+'[")]';return this.format(i+n+"-MM-DD[T]HH:mm:ss.SSS"+o)},xi.toJSON=function(){return this.isValid()?this.toISOString():null},xi.toString=function(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},xi.unix=function(){return Math.floor(this.valueOf()/1e3)},xi.valueOf=function(){return this._d.valueOf()-6e4*(this._offset||0)},xi.creationData=function(){return {input:this._i,format:this._f,locale:this._locale,isUTC:this._isUTC,strict:this._strict}},xi.year=Tt,xi.isLeapYear=function(){return Et(this.year())},xi.weekYear=function(t){return vi.call(this,t,this.week(),this.weekday(),this.localeData()._week.dow,this.localeData()._week.doy)},xi.isoWeekYear=function(t){return vi.call(this,t,this.isoWeek(),this.isoWeekday(),1,4)},xi.quarter=xi.quarters=function(t){return null==t?Math.ceil((this.month()+1)/3):this.month(3*(t-1)+this.month()%3)},xi.month=Rt,xi.daysInMonth=function(){return It(this.year(),this.month())},xi.week=xi.weeks=function(t){var e=this.localeData().week(this);return null==t?e:this.add(7*(t-e),"d")},xi.isoWeek=xi.isoWeeks=function(t){var e=qt(this,1,4).week;return null==t?e:this.add(7*(t-e),"d")},xi.weeksInYear=function(){var t=this.localeData()._week;return Xt(this.year(),t.dow,t.doy)},xi.isoWeeksInYear=function(){return Xt(this.year(),1,4)},xi.date=gi,xi.day=xi.days=function(t){if(!this.isValid())return null!=t?this:NaN;var e=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=t?(t=function(t,e){return "string"!=typeof t?t:isNaN(t)?"number"==typeof(t=e.weekdaysParse(t))?t:null:parseInt(t,10)}(t,this.localeData()),this.add(t-e,"d")):e},xi.weekday=function(t){if(!this.isValid())return null!=t?this:NaN;var e=(this.day()+7-this.localeData()._week.dow)%7;return null==t?e:this.add(t-e,"d")},xi.isoWeekday=function(t){if(!this.isValid())return null!=t?this:NaN;if(null!=t){var e=function(t,e){return "string"==typeof t?e.weekdaysParse(t)%7||7:isNaN(t)?null:t}(t,this.localeData());return this.day(this.day()%7?e:e-7)}return this.day()||7},xi.dayOfYear=function(t){var e=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==t?e:this.add(t-e,"d")},xi.hour=xi.hours=he,xi.minute=xi.minutes=mi,xi.second=xi.seconds=wi,xi.millisecond=xi.milliseconds=ki,xi.utcOffset=function(t,e,i){var n,r=this._offset||0;if(!this.isValid())return null!=t?this:NaN;if(null!=t){if("string"==typeof t){if(null===(t=Ve(at,t)))return this}else Math.abs(t)<16&&!i&&(t*=60);return !this._isUTC&&e&&(n=Ge(this)),this._offset=t,this._isUTC=!0,null!=n&&this.add(n,"m"),r!==t&&(!e||this._changeInProgress?ti(this,Ke(t-r,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,o.updateOffset(this,!0),this._changeInProgress=null)),this}return this._isUTC?r:Ge(this)},xi.utc=function(t){return this.utcOffset(0,t)},xi.local=function(t){return this._isUTC&&(this.utcOffset(0,t),this._isUTC=!1,t&&this.subtract(Ge(this),"m")),this},xi.parseZone=function(){if(null!=this._tzm)this.utcOffset(this._tzm,!1,!0);else if("string"==typeof this._i){var t=Ve(st,this._i);null!=t?this.utcOffset(t):this.utcOffset(0,!0);}return this},xi.hasAlignedHourOffset=function(t){return !!this.isValid()&&(t=t?Fe(t).utcOffset():0,(this.utcOffset()-t)%60==0)},xi.isDST=function(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()},xi.isLocal=function(){return !!this.isValid()&&!this._isUTC},xi.isUtcOffset=function(){return !!this.isValid()&&this._isUTC},xi.isUtc=qe,xi.isUTC=qe,xi.zoneAbbr=function(){return this._isUTC?"UTC":""},xi.zoneName=function(){return this._isUTC?"Coordinated Universal Time":""},xi.dates=M("dates accessor is deprecated. Use date instead.",gi),xi.months=M("months accessor is deprecated. Use month instead",Rt),xi.years=M("years accessor is deprecated. Use year instead",Tt),xi.zone=M("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/",(function(t,e){return null!=t?("string"!=typeof t&&(t=-t),this.utcOffset(t,e),this):-this.utcOffset()})),xi.isDSTShifted=M("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information",(function(){if(!a(this._isDSTShifted))return this._isDSTShifted;var t={};if(m(t,this),(t=Ae(t))._a){var e=t._isUTC?f(t._a):Fe(t._a);this._isDSTShifted=this.isValid()&&O(t._a,e.toArray())>0;}else this._isDSTShifted=!1;return this._isDSTShifted}));var Si=A.prototype;function Mi(t,e,i,n){var o=ye(),r=f().set(n,e);return o[i](r,t)}function Ei(t,e,i){if(h(t)&&(e=t,t=void 0),t=t||"",null!=e)return Mi(t,e,i,"month");var n,o=[];for(n=0;n<12;n++)o[n]=Mi(t,n,i,"month");return o}function Di(t,e,i,n){"boolean"==typeof t?(h(e)&&(i=e,e=void 0),e=e||""):(i=e=t,t=!1,h(e)&&(i=e,e=void 0),e=e||"");var o,r=ye(),s=t?r._week.dow:0;if(null!=i)return Mi(e,(i+s)%7,n,"day");var a=[];for(o=0;o<7;o++)a[o]=Mi(e,(o+s)%7,n,"day");return a}Si.calendar=function(t,e,i){var n=this._calendar[t]||this._calendar.sameElse;return C(n)?n.call(e,i):n},Si.longDateFormat=function(t){var e=this._longDateFormat[t],i=this._longDateFormat[t.toUpperCase()];return e||!i?e:(this._longDateFormat[t]=i.replace(/MMMM|MM|DD|dddd/g,(function(t){return t.slice(1)})),this._longDateFormat[t])},Si.invalidDate=function(){return this._invalidDate},Si.ordinal=function(t){return this._ordinal.replace("%d",t)},Si.preparse=Oi,Si.postformat=Oi,Si.relativeTime=function(t,e,i,n){var o=this._relativeTime[i];return C(o)?o(t,e,i,n):o.replace(/%d/i,t)},Si.pastFuture=function(t,e){var i=this._relativeTime[t>0?"future":"past"];return C(i)?i(e):i.replace(/%s/i,e)},Si.set=function(t){var e,i;for(i in t)C(e=t[i])?this[i]=e:this["_"+i]=e;this._config=t,this._dayOfMonthOrdinalParseLenient=new RegExp((this._dayOfMonthOrdinalParse.source||this._ordinalParse.source)+"|"+/\d{1,2}/.source);},Si.months=function(t,e){return t?r(this._months)?this._months[t.month()]:this._months[(this._months.isFormat||Ft).test(e)?"format":"standalone"][t.month()]:r(this._months)?this._months:this._months.standalone},Si.monthsShort=function(t,e){return t?r(this._monthsShort)?this._monthsShort[t.month()]:this._monthsShort[Ft.test(e)?"format":"standalone"][t.month()]:r(this._monthsShort)?this._monthsShort:this._monthsShort.standalone},Si.monthsParse=function(t,e,i){var n,o,r;if(this._monthsParseExact)return zt.call(this,t,e,i);for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),n=0;n<12;n++){if(o=f([2e3,n]),i&&!this._longMonthsParse[n]&&(this._longMonthsParse[n]=new RegExp("^"+this.months(o,"").replace(".","")+"$","i"),this._shortMonthsParse[n]=new RegExp("^"+this.monthsShort(o,"").replace(".","")+"$","i")),i||this._monthsParse[n]||(r="^"+this.months(o,"")+"|^"+this.monthsShort(o,""),this._monthsParse[n]=new RegExp(r.replace(".",""),"i")),i&&"MMMM"===e&&this._longMonthsParse[n].test(t))return n;if(i&&"MMM"===e&&this._shortMonthsParse[n].test(t))return n;if(!i&&this._monthsParse[n].test(t))return n}},Si.monthsRegex=function(t){return this._monthsParseExact?(u(this,"_monthsRegex")||Ht.call(this),t?this._monthsStrictRegex:this._monthsRegex):(u(this,"_monthsRegex")||(this._monthsRegex=Yt),this._monthsStrictRegex&&t?this._monthsStrictRegex:this._monthsRegex)},Si.monthsShortRegex=function(t){return this._monthsParseExact?(u(this,"_monthsRegex")||Ht.call(this),t?this._monthsShortStrictRegex:this._monthsShortRegex):(u(this,"_monthsShortRegex")||(this._monthsShortRegex=Bt),this._monthsShortStrictRegex&&t?this._monthsShortStrictRegex:this._monthsShortRegex)},Si.week=function(t){return qt(t,this._week.dow,this._week.doy).week},Si.firstDayOfYear=function(){return this._week.doy},Si.firstDayOfWeek=function(){return this._week.dow},Si.weekdays=function(t,e){var i=r(this._weekdays)?this._weekdays:this._weekdays[t&&!0!==t&&this._weekdays.isFormat.test(e)?"format":"standalone"];return !0===t?Zt(i,this._week.dow):t?i[t.day()]:i},Si.weekdaysMin=function(t){return !0===t?Zt(this._weekdaysMin,this._week.dow):t?this._weekdaysMin[t.day()]:this._weekdaysMin},Si.weekdaysShort=function(t){return !0===t?Zt(this._weekdaysShort,this._week.dow):t?this._weekdaysShort[t.day()]:this._weekdaysShort},Si.weekdaysParse=function(t,e,i){var n,o,r;if(this._weekdaysParseExact)return Qt.call(this,t,e,i);for(this._weekdaysParse||(this._weekdaysParse=[],this._minWeekdaysParse=[],this._shortWeekdaysParse=[],this._fullWeekdaysParse=[]),n=0;n<7;n++){if(o=f([2e3,1]).day(n),i&&!this._fullWeekdaysParse[n]&&(this._fullWeekdaysParse[n]=new RegExp("^"+this.weekdays(o,"").replace(".","\\.?")+"$","i"),this._shortWeekdaysParse[n]=new RegExp("^"+this.weekdaysShort(o,"").replace(".","\\.?")+"$","i"),this._minWeekdaysParse[n]=new RegExp("^"+this.weekdaysMin(o,"").replace(".","\\.?")+"$","i")),this._weekdaysParse[n]||(r="^"+this.weekdays(o,"")+"|^"+this.weekdaysShort(o,"")+"|^"+this.weekdaysMin(o,""),this._weekdaysParse[n]=new RegExp(r.replace(".",""),"i")),i&&"dddd"===e&&this._fullWeekdaysParse[n].test(t))return n;if(i&&"ddd"===e&&this._shortWeekdaysParse[n].test(t))return n;if(i&&"dd"===e&&this._minWeekdaysParse[n].test(t))return n;if(!i&&this._weekdaysParse[n].test(t))return n}},Si.weekdaysRegex=function(t){return this._weekdaysParseExact?(u(this,"_weekdaysRegex")||ne.call(this),t?this._weekdaysStrictRegex:this._weekdaysRegex):(u(this,"_weekdaysRegex")||(this._weekdaysRegex=te),this._weekdaysStrictRegex&&t?this._weekdaysStrictRegex:this._weekdaysRegex)},Si.weekdaysShortRegex=function(t){return this._weekdaysParseExact?(u(this,"_weekdaysRegex")||ne.call(this),t?this._weekdaysShortStrictRegex:this._weekdaysShortRegex):(u(this,"_weekdaysShortRegex")||(this._weekdaysShortRegex=ee),this._weekdaysShortStrictRegex&&t?this._weekdaysShortStrictRegex:this._weekdaysShortRegex)},Si.weekdaysMinRegex=function(t){return this._weekdaysParseExact?(u(this,"_weekdaysRegex")||ne.call(this),t?this._weekdaysMinStrictRegex:this._weekdaysMinRegex):(u(this,"_weekdaysMinRegex")||(this._weekdaysMinRegex=ie),this._weekdaysMinStrictRegex&&t?this._weekdaysMinStrictRegex:this._weekdaysMinRegex)},Si.isPM=function(t){return "p"===(t+"").toLowerCase().charAt(0)},Si.meridiem=function(t,e,i){return t>11?i?"pm":"PM":i?"am":"AM"},pe("en",{dayOfMonthOrdinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(t){var e=t%10;return t+(1===x(t%100/10)?"th":1===e?"st":2===e?"nd":3===e?"rd":"th")}}),o.lang=M("moment.lang is deprecated. Use moment.locale instead.",pe),o.langData=M("moment.langData is deprecated. Use moment.localeData instead.",ye);var Ti=Math.abs;function Ci(t,e,i,n){var o=Ke(e,i);return t._milliseconds+=n*o._milliseconds,t._days+=n*o._days,t._months+=n*o._months,t._bubble()}function Pi(t){return t<0?Math.floor(t):Math.ceil(t)}function Ai(t){return 4800*t/146097}function Ii(t){return 146097*t/4800}function Fi(t){return function(){return this.as(t)}}var Ni=Fi("ms"),ji=Fi("s"),zi=Fi("m"),Li=Fi("h"),Ri=Fi("d"),Bi=Fi("w"),Yi=Fi("M"),Hi=Fi("Q"),Wi=Fi("y");function Vi(t){return function(){return this.isValid()?this._data[t]:NaN}}var Ui=Vi("milliseconds"),Gi=Vi("seconds"),qi=Vi("minutes"),Xi=Vi("hours"),Zi=Vi("days"),Ki=Vi("months"),$i=Vi("years"),Ji=Math.round,Qi={ss:44,s:45,m:45,h:22,d:26,M:11};function tn(t,e,i,n,o){return o.relativeTime(e||1,!!i,t,n)}var en=Math.abs;function nn(t){return (t>0)-(t<0)||+t}function on(){if(!this.isValid())return this.localeData().invalidDate();var t,e,i=en(this._milliseconds)/1e3,n=en(this._days),o=en(this._months);t=k(i/60),e=k(t/60),i%=60,t%=60;var r=k(o/12),s=o%=12,a=n,h=e,l=t,d=i?i.toFixed(3).replace(/\.?0+$/,""):"",u=this.asSeconds();if(!u)return "P0D";var c=u<0?"-":"",f=nn(this._months)!==nn(u)?"-":"",p=nn(this._days)!==nn(u)?"-":"",v=nn(this._milliseconds)!==nn(u)?"-":"";return c+"P"+(r?f+r+"Y":"")+(s?f+s+"M":"")+(a?p+a+"D":"")+(h||l||d?"T":"")+(h?v+h+"H":"")+(l?v+l+"M":"")+(d?v+d+"S":"")}var rn=Re.prototype;return rn.isValid=function(){return this._isValid},rn.abs=function(){var t=this._data;return this._milliseconds=Ti(this._milliseconds),this._days=Ti(this._days),this._months=Ti(this._months),t.milliseconds=Ti(t.milliseconds),t.seconds=Ti(t.seconds),t.minutes=Ti(t.minutes),t.hours=Ti(t.hours),t.months=Ti(t.months),t.years=Ti(t.years),this},rn.add=function(t,e){return Ci(this,t,e,1)},rn.subtract=function(t,e){return Ci(this,t,e,-1)},rn.as=function(t){if(!this.isValid())return NaN;var e,i,n=this._milliseconds;if("month"===(t=N(t))||"quarter"===t||"year"===t)switch(e=this._days+n/864e5,i=this._months+Ai(e),t){case"month":return i;case"quarter":return i/3;case"year":return i/12}else switch(e=this._days+Math.round(Ii(this._months)),t){case"week":return e/7+n/6048e5;case"day":return e+n/864e5;case"hour":return 24*e+n/36e5;case"minute":return 1440*e+n/6e4;case"second":return 86400*e+n/1e3;case"millisecond":return Math.floor(864e5*e)+n;default:throw new Error("Unknown unit "+t)}},rn.asMilliseconds=Ni,rn.asSeconds=ji,rn.asMinutes=zi,rn.asHours=Li,rn.asDays=Ri,rn.asWeeks=Bi,rn.asMonths=Yi,rn.asQuarters=Hi,rn.asYears=Wi,rn.valueOf=function(){return this.isValid()?this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*x(this._months/12):NaN},rn._bubble=function(){var t,e,i,n,o,r=this._milliseconds,s=this._days,a=this._months,h=this._data;return r>=0&&s>=0&&a>=0||r<=0&&s<=0&&a<=0||(r+=864e5*Pi(Ii(a)+s),s=0,a=0),h.milliseconds=r%1e3,t=k(r/1e3),h.seconds=t%60,e=k(t/60),h.minutes=e%60,i=k(e/60),h.hours=i%24,s+=k(i/24),o=k(Ai(s)),a+=o,s-=Pi(Ii(o)),n=k(a/12),a%=12,h.days=s,h.months=a,h.years=n,this},rn.clone=function(){return Ke(this)},rn.get=function(t){return t=N(t),this.isValid()?this[t+"s"]():NaN},rn.milliseconds=Ui,rn.seconds=Gi,rn.minutes=qi,rn.hours=Xi,rn.days=Zi,rn.weeks=function(){return k(this.days()/7)},rn.months=Ki,rn.years=$i,rn.humanize=function(t){if(!this.isValid())return this.localeData().invalidDate();var e=this.localeData(),i=function(t,e,i){var n=Ke(t).abs(),o=Ji(n.as("s")),r=Ji(n.as("m")),s=Ji(n.as("h")),a=Ji(n.as("d")),h=Ji(n.as("M")),l=Ji(n.as("y")),d=o<=Qi.ss&&["s",o]||o<Qi.s&&["ss",o]||r<=1&&["m"]||r<Qi.m&&["mm",r]||s<=1&&["h"]||s<Qi.h&&["hh",s]||a<=1&&["d"]||a<Qi.d&&["dd",a]||h<=1&&["M"]||h<Qi.M&&["MM",h]||l<=1&&["y"]||["yy",l];return d[2]=e,d[3]=+t>0,d[4]=i,tn.apply(null,d)}(this,!t,e);return t&&(i=e.pastFuture(+this,i)),e.postformat(i)},rn.toISOString=on,rn.toString=on,rn.toJSON=on,rn.locale=oi,rn.localeData=si,rn.toIsoString=M("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",on),rn.lang=ri,V("X",0,0,"unix"),V("x",0,0,"valueOf"),dt("x",rt),dt("X",/[+-]?\d+(\.\d{1,3})?/),pt("X",(function(t,e,i){i._d=new Date(1e3*parseFloat(t,10));})),pt("x",(function(t,e,i){i._d=new Date(x(t));})),o.version="2.24.0",i=Fe,o.fn=xi,o.min=function(){return ze("isBefore",[].slice.call(arguments,0))},o.max=function(){return ze("isAfter",[].slice.call(arguments,0))},o.now=function(){return Date.now?Date.now():+new Date},o.utc=f,o.unix=function(t){return Fe(1e3*t)},o.months=function(t,e){return Ei(t,e,"months")},o.isDate=l,o.locale=pe,o.invalid=y,o.duration=Ke,o.isMoment=_,o.weekdays=function(t,e,i){return Di(t,e,i,"weekdays")},o.parseZone=function(){return Fe.apply(null,arguments).parseZone()},o.localeData=ye,o.isDuration=Be,o.monthsShort=function(t,e){return Ei(t,e,"monthsShort")},o.weekdaysMin=function(t,e,i){return Di(t,e,i,"weekdaysMin")},o.defineLocale=ve,o.updateLocale=function(t,e){if(null!=e){var i,n,o=le;null!=(n=fe(t))&&(o=n._config),e=P(o,e),(i=new A(e)).parentLocale=de[t],de[t]=i,pe(t);}else null!=de[t]&&(null!=de[t].parentLocale?de[t]=de[t].parentLocale:null!=de[t]&&delete de[t]);return de[t]},o.locales=function(){return E(de)},o.weekdaysShort=function(t,e,i){return Di(t,e,i,"weekdaysShort")},o.normalizeUnits=N,o.relativeTimeRounding=function(t){return void 0===t?Ji:"function"==typeof t&&(Ji=t,!0)},o.relativeTimeThreshold=function(t,e){return void 0!==Qi[t]&&(void 0===e?Qi[t]:(Qi[t]=e,"s"===t&&(Qi.ss=e-1),!0))},o.calendarFormat=function(t,e){var i=t.diff(e,"days",!0);return i<-6?"sameElse":i<-1?"lastWeek":i<0?"lastDay":i<1?"sameDay":i<2?"nextDay":i<7?"nextWeek":"sameElse"},o.prototype=xi,o.HTML5_FMT={DATETIME_LOCAL:"YYYY-MM-DDTHH:mm",DATETIME_LOCAL_SECONDS:"YYYY-MM-DDTHH:mm:ss",DATETIME_LOCAL_MS:"YYYY-MM-DDTHH:mm:ss.SSS",DATE:"YYYY-MM-DD",TIME:"HH:mm",TIME_SECONDS:"HH:mm:ss",TIME_MS:"HH:mm:ss.SSS",WEEK:"GGGG-[W]WW",MONTH:"YYYY-MM"},o}();})),WT="undefined"!=typeof window&&window.moment||HT,VT=Object.freeze({__proto__:null,default:WT,__moduleExports:WT}),UT={Images:Dc,dotparser:Jl,gephiParser:sd,allOptions:TT,convertDot:Kl,convertGephi:rd},GT=Object.freeze({__proto__:null,network:UT,DOMutil:YT,util:Us,data:wO,moment:VT,Hammer:mc,keycharm:ld,DataSet:gO,DataView:mO,Queue:sO,Network:AT});//# sourceMappingURL=vis-network.esm.min.js.map

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let nodes = new gO([]);
    let edges = new gO([]);

    let graph = new writable({});

    const updateNode = (node) => {nodes.update(node);};
    const updateEdge = (edge) => {edges.update(edge);};

    const addNode = (node) => {return nodes.add(node)};
    const addEdge = (edge) => {return edges.add(edge)};

    const removeNode = (node) => {nodes.remove(node);};
    const removeEdge = (edge) => {edges.remove(edge);};


    nodes.on('*', function (event, properties, senderId) { 
       graph.set({  nodes: nodes.get(), edges: edges.get()});
    });

    edges.on('*', function (event, properties, senderId) {  
        graph.set({  nodes: nodes.get(), edges: edges.get()});
    });

    // addNode({id:-1, label:"Start", color:"green"});
    addNode({id:0, label:"Hello"});
    addNode({id:2, label:"World"});

    //addEdge({from:-1, to:0} )
    addEdge({from:0, to:2} );

    let views = {
        Document: {view: { shape:'image' }, props: [{image:'./example-document.jpg'}, { size:45}]}
      // , Validator: {view: { shape:'image' }, props: [{image:'./contract-signing.png'}, { size:45}]}
        ,Node: { view: {shape:'ellipse'}, props:[]}
        ,Data: { view: {'shape': 'box', 'font': {'face': 'monospace', 'align': 'left'}}, props:[]}
      //  ,Youtube: {view: { shape:'image' }, props: [{image:'./example-document.jpg'}, { size:45}]}
    };

    const buildNodeView = (node) => {
       
        if (node.nodeClass) {
            let view = views[node.nodeClass] ? views[node.nodeClass].view : {};
           
            let ret = {...view};
            
            let props = views[node.nodeClass] ? views[node.nodeClass].props : []; 
                props.forEach(p => {
                  
                    let prop = Object.keys(p)[0];
                    console.log(prop);
                   if (node[prop] === undefined) {
                    ret = {...ret, ...p};
                }
                }); 
                return ret;
            } 
        else { 
            return {} 
        }
      
    } ;

    let views$1 = {
        Follows: {view: { color:'orange' }, props: [{font: {align:'middle'}}]}
     
    };

    const buildEdgeView = (edge) => {
       
        if (edge.edgeClass) {
            let view = views$1[edge.edgeClass] ? views$1[edge.edgeClass].view : {};
           
            let ret = {...view};
            
            let props = views$1[edge.edgeClass] ? views$1[edge.edgeClass].props : []; 
                props.forEach(p => {
                  
                    let prop = Object.keys(p)[0];
                    console.log(prop);
                   if (edge[prop] === undefined) {
                    ret = {...ret, ...p};
                }
                }); 
                return ret;
            } 
        else { 
            return {} 
        }
      
    } ;

    /* src/NodeEditor.svelte generated by Svelte v3.16.6 */
    const file = "src/NodeEditor.svelte";

    // (10:0) {#if node}
    function create_if_block(ctx) {
    	let div;
    	let p0;
    	let input;
    	let t0;
    	let p1;
    	let textarea;
    	let t1;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			input = element("input");
    			t0 = space();
    			p1 = element("p");
    			textarea = element("textarea");
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Classes");
    			add_location(input, file, 11, 4, 141);
    			add_location(p0, file, 11, 1, 138);
    			attr_dev(textarea, "placeholder", "Label");
    			add_location(textarea, file, 12, 5, 221);
    			add_location(p1, file, 12, 2, 218);
    			add_location(div, file, 10, 0, 131);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[4])
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, input);
    			set_input_value(input, /*node*/ ctx[0].nodeClass);
    			append_dev(div, t0);
    			append_dev(div, p1);
    			append_dev(p1, textarea);
    			set_input_value(textarea, /*node*/ ctx[0].label);
    			append_dev(div, t1);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*node*/ 1 && input.value !== /*node*/ ctx[0].nodeClass) {
    				set_input_value(input, /*node*/ ctx[0].nodeClass);
    			}

    			if (dirty & /*node*/ 1) {
    				set_input_value(textarea, /*node*/ ctx[0].label);
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(10:0) {#if node}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*node*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*node*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { node } = $$props;
    	const writable_props = ["node"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NodeEditor> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function input_input_handler() {
    		node.nodeClass = this.value;
    		$$invalidate(0, node);
    	}

    	function textarea_input_handler() {
    		node.label = this.value;
    		$$invalidate(0, node);
    	}

    	$$self.$set = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { node };
    	};

    	$$self.$inject_state = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*node*/ 1) {
    			 {
    				updateNode(node);
    			}
    		}
    	};

    	return [node, $$scope, $$slots, input_input_handler, textarea_input_handler];
    }

    class NodeEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { node: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NodeEditor",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*node*/ ctx[0] === undefined && !("node" in props)) {
    			console.warn("<NodeEditor> was created without expected prop 'node'");
    		}
    	}

    	get node() {
    		throw new Error("<NodeEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<NodeEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/EdgeEditor.svelte generated by Svelte v3.16.6 */
    const file$1 = "src/EdgeEditor.svelte";

    // (15:0) {#if edge}
    function create_if_block$1(ctx) {
    	let p;
    	let input0;
    	let t0;
    	let textarea;
    	let t1;
    	let input1;
    	let t2;
    	let input2;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			input0 = element("input");
    			t0 = space();
    			textarea = element("textarea");
    			t1 = space();
    			input1 = element("input");
    			t2 = space();
    			input2 = element("input");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Classes");
    			add_location(input0, file$1, 15, 6, 147);
    			add_location(p, file$1, 15, 3, 144);
    			attr_dev(textarea, "placeholder", "label");
    			add_location(textarea, file$1, 16, 4, 226);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "color");
    			add_location(input1, file$1, 17, 4, 286);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "placeholder", "value");
    			add_location(input2, file$1, 18, 4, 355);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[1]),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[2]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[3]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[4])
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, input0);
    			set_input_value(input0, /*edge*/ ctx[0].edgeClass);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*edge*/ ctx[0].label);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*edge*/ ctx[0].color);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, input2, anchor);
    			set_input_value(input2, /*edge*/ ctx[0].value);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*edge*/ 1 && input0.value !== /*edge*/ ctx[0].edgeClass) {
    				set_input_value(input0, /*edge*/ ctx[0].edgeClass);
    			}

    			if (dirty & /*edge*/ 1) {
    				set_input_value(textarea, /*edge*/ ctx[0].label);
    			}

    			if (dirty & /*edge*/ 1 && input1.value !== /*edge*/ ctx[0].color) {
    				set_input_value(input1, /*edge*/ ctx[0].color);
    			}

    			if (dirty & /*edge*/ 1 && input2.value !== /*edge*/ ctx[0].value) {
    				set_input_value(input2, /*edge*/ ctx[0].value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(input2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(15:0) {#if edge}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*edge*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*edge*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { edge } = $$props;
    	const writable_props = ["edge"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EdgeEditor> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		edge.edgeClass = this.value;
    		$$invalidate(0, edge);
    	}

    	function textarea_input_handler() {
    		edge.label = this.value;
    		$$invalidate(0, edge);
    	}

    	function input1_input_handler() {
    		edge.color = this.value;
    		$$invalidate(0, edge);
    	}

    	function input2_input_handler() {
    		edge.value = this.value;
    		$$invalidate(0, edge);
    	}

    	$$self.$set = $$props => {
    		if ("edge" in $$props) $$invalidate(0, edge = $$props.edge);
    	};

    	$$self.$capture_state = () => {
    		return { edge };
    	};

    	$$self.$inject_state = $$props => {
    		if ("edge" in $$props) $$invalidate(0, edge = $$props.edge);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*edge*/ 1) {
    			 {
    				updateEdge(edge);
    			}
    		}
    	};

    	return [
    		edge,
    		input0_input_handler,
    		textarea_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class EdgeEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { edge: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EdgeEditor",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*edge*/ ctx[0] === undefined && !("edge" in props)) {
    			console.warn("<EdgeEditor> was created without expected prop 'edge'");
    		}
    	}

    	get edge() {
    		throw new Error("<EdgeEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edge(value) {
    		throw new Error("<EdgeEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/NodeEditorDocument.svelte generated by Svelte v3.16.6 */

    const { console: console_1 } = globals;
    const file$2 = "src/NodeEditorDocument.svelte";

    // (56:0) {#if node}
    function create_if_block$2(ctx) {
    	let input0;
    	let t0;
    	let input1;
    	let span;
    	let t1;
    	let t2_value = /*node*/ ctx[0].size + "";
    	let t2;
    	let dispose;

    	const block = {
    		c: function create() {
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			span = element("span");
    			t1 = text(" ");
    			t2 = text(t2_value);
    			attr_dev(input0, "type", "file");
    			attr_dev(input0, "accept", "image/*");
    			attr_dev(input0, "class", "w-full h-full cursor-pointer");
    			add_location(input0, file$2, 57, 4, 1384);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "45");
    			attr_dev(input1, "max", "200");
    			attr_dev(input1, "step", "5");
    			add_location(input1, file$2, 64, 4, 1531);
    			add_location(span, file$2, 64, 67, 1594);

    			dispose = [
    				listen_dev(input0, "change", /*input0_change_handler*/ ctx[3]),
    				listen_dev(input0, "change", /*changed*/ ctx[2], false, false, false),
    				listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[4]),
    				listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[4])
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*node*/ ctx[0].size);
    			insert_dev(target, span, anchor);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*node*/ 1) {
    				set_input_value(input1, /*node*/ ctx[0].size);
    			}

    			if (dirty & /*node*/ 1 && t2_value !== (t2_value = /*node*/ ctx[0].size + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(span);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(56:0) {#if node}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*node*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*node*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function toDataURL(src, callback, outputFormat) {
    	var img = new Image();
    	img.crossOrigin = "Anonymous";

    	img.onload = function () {
    		var canvas = document.createElement("CANVAS");
    		var ctx = canvas.getContext("2d");
    		var dataURL;
    		canvas.height = this.naturalHeight;
    		canvas.width = this.naturalWidth;
    		ctx.drawImage(this, 0, 0);
    		dataURL = canvas.toDataURL(outputFormat);
    		callback(dataURL);
    		document.deleteElement("CANVAS");
    	};

    	img.src = src;

    	if (img.complete || img.complete === undefined) {
    		img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    		img.src = src;
    	}
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { node } = $$props;
    	let files = [];

    	const changed = event => {
    		$$invalidate(1, files = event.target.files);
    		$$invalidate(0, node.image = window.URL.createObjectURL(files[0]), node);

    		toDataURL(node.image, function (dataUrl) {
    			$$invalidate(0, node.image = dataUrl, node);
    		});
    	};

    	const writable_props = ["node"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<NodeEditorDocument> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler() {
    		files = this.files;
    		$$invalidate(1, files);
    	}

    	function input1_change_input_handler() {
    		node.size = to_number(this.value);
    		$$invalidate(0, node);
    	}

    	$$self.$set = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    	};

    	$$self.$capture_state = () => {
    		return { node, files };
    	};

    	$$self.$inject_state = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    		if ("files" in $$props) $$invalidate(1, files = $$props.files);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*node*/ 1) {
    			 {
    				updateNode(node);
    				console.log("updateNode");
    			}
    		}
    	};

    	return [node, files, changed, input0_change_handler, input1_change_input_handler];
    }

    class NodeEditorDocument extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { node: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NodeEditorDocument",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*node*/ ctx[0] === undefined && !("node" in props)) {
    			console_1.warn("<NodeEditorDocument> was created without expected prop 'node'");
    		}
    	}

    	get node() {
    		throw new Error("<NodeEditorDocument>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<NodeEditorDocument>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/NodeEditorValidator.svelte generated by Svelte v3.16.6 */
    const file$3 = "src/NodeEditorValidator.svelte";

    // (30:0) {#if node}
    function create_if_block$3(ctx) {
    	let p;
    	let input;
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let button2;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			input = element("input");
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Approve";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Reject";
    			t4 = space();
    			button2 = element("button");
    			button2.textContent = "Remove";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Reason");
    			add_location(input, file$3, 30, 5, 722);
    			add_location(p, file$3, 30, 2, 719);
    			add_location(button0, file$3, 31, 4, 793);
    			add_location(button1, file$3, 32, 4, 841);
    			add_location(button2, file$3, 33, 2, 885);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    				listen_dev(button0, "click", /*approve*/ ctx[2], false, false, false),
    				listen_dev(button1, "click", /*reject*/ ctx[3], false, false, false),
    				listen_dev(button2, "click", /*remove*/ ctx[4], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, input);
    			set_input_value(input, /*reason*/ ctx[1]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, button2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*reason*/ 2 && input.value !== /*reason*/ ctx[1]) {
    				set_input_value(input, /*reason*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(button2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(30:0) {#if node}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*node*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*node*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { node } = $$props;
    	let reason;

    	function approve() {
    		var id = addNode({
    			label: reason,
    			nodeClass: "ValidatorAccepted"
    		});

    		addEdge({
    			label: "approved",
    			from: node.id,
    			to: id[0]
    		});
    	}

    	function reject() {
    		var id = addNode({
    			label: reason,
    			nodeClass: "ValidatorRejected"
    		});

    		addEdge({
    			label: "rejected",
    			from: node.id,
    			to: id[0]
    		});
    	}

    	function remove() {
    		removeNode(node);
    	}

    	const writable_props = ["node"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NodeEditorValidator> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		reason = this.value;
    		$$invalidate(1, reason);
    	}

    	$$self.$set = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    	};

    	$$self.$capture_state = () => {
    		return { node, reason };
    	};

    	$$self.$inject_state = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    		if ("reason" in $$props) $$invalidate(1, reason = $$props.reason);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*node*/ 1) {
    			 {
    				updateNode(node);
    			}
    		}
    	};

    	return [node, reason, approve, reject, remove, input_input_handler];
    }

    class NodeEditorValidator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { node: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NodeEditorValidator",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*node*/ ctx[0] === undefined && !("node" in props)) {
    			console.warn("<NodeEditorValidator> was created without expected prop 'node'");
    		}
    	}

    	get node() {
    		throw new Error("<NodeEditorValidator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<NodeEditorValidator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/NodeEditorValidatorRejected.svelte generated by Svelte v3.16.6 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/NodeEditorValidatorRejected.svelte";

    // (24:0) {#if node}
    function create_if_block$4(ctx) {
    	let p;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			button = element("button");
    			button.textContent = "Acknowledge";
    			add_location(button, file$4, 26, 4, 423);
    			add_location(p, file$4, 25, 2, 415);
    			dispose = listen_dev(button, "click", /*acknowledge*/ ctx[1], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, button);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(24:0) {#if node}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let if_block = /*node*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*node*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { node } = $$props;
    	let reason;

    	function acknowledge() {
    		let subject = node.subject;
    		console.log("subject:", subject);
    		removeNode(node.reasonId);
    		removeNode(node);
    	}

    	const writable_props = ["node"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<NodeEditorValidatorRejected> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    	};

    	$$self.$capture_state = () => {
    		return { node, reason };
    	};

    	$$self.$inject_state = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    		if ("reason" in $$props) reason = $$props.reason;
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*node*/ 1) {
    			 {
    				updateNode(node);
    			}
    		}
    	};

    	return [node, acknowledge];
    }

    class NodeEditorValidatorRejected extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { node: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NodeEditorValidatorRejected",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*node*/ ctx[0] === undefined && !("node" in props)) {
    			console_1$1.warn("<NodeEditorValidatorRejected> was created without expected prop 'node'");
    		}
    	}

    	get node() {
    		throw new Error("<NodeEditorValidatorRejected>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<NodeEditorValidatorRejected>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/NodeEditorValidatorAccepted.svelte generated by Svelte v3.16.6 */

    const { console: console_1$2 } = globals;
    const file$5 = "src/NodeEditorValidatorAccepted.svelte";

    // (24:0) {#if node}
    function create_if_block$5(ctx) {
    	let p;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			button = element("button");
    			button.textContent = "Acknowledge";
    			add_location(button, file$5, 26, 4, 423);
    			add_location(p, file$5, 25, 2, 415);
    			dispose = listen_dev(button, "click", /*acknowledge*/ ctx[1], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, button);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(24:0) {#if node}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*node*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*node*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { node } = $$props;
    	let reason;

    	function acknowledge() {
    		let subject = node.subject;
    		console.log("subject:", subject);
    		removeNode(node.reasonId);
    		removeNode(node);
    	}

    	const writable_props = ["node"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<NodeEditorValidatorAccepted> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    	};

    	$$self.$capture_state = () => {
    		return { node, reason };
    	};

    	$$self.$inject_state = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    		if ("reason" in $$props) reason = $$props.reason;
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*node*/ 1) {
    			 {
    				updateNode(node);
    			}
    		}
    	};

    	return [node, acknowledge];
    }

    class NodeEditorValidatorAccepted extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { node: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NodeEditorValidatorAccepted",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*node*/ ctx[0] === undefined && !("node" in props)) {
    			console_1$2.warn("<NodeEditorValidatorAccepted> was created without expected prop 'node'");
    		}
    	}

    	get node() {
    		throw new Error("<NodeEditorValidatorAccepted>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<NodeEditorValidatorAccepted>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AudioPlayer.svelte generated by Svelte v3.16.6 */
    const file$6 = "src/AudioPlayer.svelte";

    function create_fragment$6(ctx) {
    	let article;
    	let h2;
    	let t0;
    	let t1;
    	let p;
    	let strong;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let audio_1;
    	let audio_1_src_value;
    	let audio_1_is_paused = true;
    	let dispose;

    	const block = {
    		c: function create() {
    			article = element("article");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			p = element("p");
    			strong = element("strong");
    			t2 = text(/*composer*/ ctx[2]);
    			t3 = text(" / performed by ");
    			t4 = text(/*performer*/ ctx[3]);
    			t5 = space();
    			audio_1 = element("audio");
    			attr_dev(h2, "class", "svelte-18j0ib");
    			add_location(h2, file$6, 48, 1, 831);
    			add_location(strong, file$6, 49, 4, 852);
    			attr_dev(p, "class", "svelte-18j0ib");
    			add_location(p, file$6, 49, 1, 849);
    			audio_1.controls = true;
    			if (audio_1.src !== (audio_1_src_value = /*src*/ ctx[0])) attr_dev(audio_1, "src", audio_1_src_value);
    			attr_dev(audio_1, "class", "svelte-18j0ib");
    			add_location(audio_1, file$6, 51, 1, 913);
    			attr_dev(article, "class", "svelte-18j0ib");
    			toggle_class(article, "playing", !/*paused*/ ctx[5]);
    			add_location(article, file$6, 47, 0, 796);

    			dispose = [
    				listen_dev(audio_1, "play", /*audio_1_play_pause_handler*/ ctx[8]),
    				listen_dev(audio_1, "pause", /*audio_1_play_pause_handler*/ ctx[8]),
    				listen_dev(audio_1, "play", /*stopOthers*/ ctx[6], false, false, false),
    				listen_dev(audio_1, "ended", next, false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h2);
    			append_dev(h2, t0);
    			append_dev(article, t1);
    			append_dev(article, p);
    			append_dev(p, strong);
    			append_dev(strong, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(article, t5);
    			append_dev(article, audio_1);
    			/*audio_1_binding*/ ctx[7](audio_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);
    			if (dirty & /*composer*/ 4) set_data_dev(t2, /*composer*/ ctx[2]);
    			if (dirty & /*performer*/ 8) set_data_dev(t4, /*performer*/ ctx[3]);

    			if (dirty & /*src*/ 1 && audio_1.src !== (audio_1_src_value = /*src*/ ctx[0])) {
    				attr_dev(audio_1, "src", audio_1_src_value);
    			}

    			if (dirty & /*paused*/ 32 && audio_1_is_paused !== (audio_1_is_paused = /*paused*/ ctx[5])) {
    				audio_1[audio_1_is_paused ? "pause" : "play"]();
    			}

    			if (dirty & /*paused*/ 32) {
    				toggle_class(article, "playing", !/*paused*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			/*audio_1_binding*/ ctx[7](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const elements = new Set();

    function next() {
    	
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { src } = $$props;
    	let { title } = $$props;
    	let { composer } = $$props;
    	let { performer } = $$props;
    	let audio;
    	let paused = true;

    	onMount(() => {
    		elements.add(audio);
    		return () => elements.delete(audio);
    	});

    	function stopOthers() {
    		elements.forEach(element => {
    			if (element !== audio) element.pause();
    		});
    	}

    	const writable_props = ["src", "title", "composer", "performer"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AudioPlayer> was created with unknown prop '${key}'`);
    	});

    	function audio_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, audio = $$value);
    		});
    	}

    	function audio_1_play_pause_handler() {
    		paused = this.paused;
    		$$invalidate(5, paused);
    	}

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("composer" in $$props) $$invalidate(2, composer = $$props.composer);
    		if ("performer" in $$props) $$invalidate(3, performer = $$props.performer);
    	};

    	$$self.$capture_state = () => {
    		return {
    			src,
    			title,
    			composer,
    			performer,
    			audio,
    			paused
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("composer" in $$props) $$invalidate(2, composer = $$props.composer);
    		if ("performer" in $$props) $$invalidate(3, performer = $$props.performer);
    		if ("audio" in $$props) $$invalidate(4, audio = $$props.audio);
    		if ("paused" in $$props) $$invalidate(5, paused = $$props.paused);
    	};

    	return [
    		src,
    		title,
    		composer,
    		performer,
    		audio,
    		paused,
    		stopOthers,
    		audio_1_binding,
    		audio_1_play_pause_handler
    	];
    }

    class AudioPlayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			src: 0,
    			title: 1,
    			composer: 2,
    			performer: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AudioPlayer",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
    			console.warn("<AudioPlayer> was created without expected prop 'src'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<AudioPlayer> was created without expected prop 'title'");
    		}

    		if (/*composer*/ ctx[2] === undefined && !("composer" in props)) {
    			console.warn("<AudioPlayer> was created without expected prop 'composer'");
    		}

    		if (/*performer*/ ctx[3] === undefined && !("performer" in props)) {
    			console.warn("<AudioPlayer> was created without expected prop 'performer'");
    		}
    	}

    	get src() {
    		throw new Error("<AudioPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<AudioPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<AudioPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AudioPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get composer() {
    		throw new Error("<AudioPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set composer(value) {
    		throw new Error("<AudioPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get performer() {
    		throw new Error("<AudioPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set performer(value) {
    		throw new Error("<AudioPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/NodeEditorAudio.svelte generated by Svelte v3.16.6 */

    const { console: console_1$3 } = globals;

    // (15:0) {#if node}
    function create_if_block$6(ctx) {
    	let current;

    	const audioplayer = new AudioPlayer({
    			props: {
    				src: "test.mp3",
    				title: "Brown Paper Bag",
    				composer: "Reprazent",
    				performer: ""
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(audioplayer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(audioplayer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(audioplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(audioplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(audioplayer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(15:0) {#if node}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*node*/ ctx[0] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*node*/ ctx[0]) {
    				if (!if_block) {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					transition_in(if_block, 1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { node } = $$props;
    	const writable_props = ["node"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<NodeEditorAudio> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    	};

    	$$self.$capture_state = () => {
    		return { node };
    	};

    	$$self.$inject_state = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*node*/ 1) {
    			 {
    				updateNode(node);
    				console.log("updateNode");
    			}
    		}
    	};

    	return [node];
    }

    class NodeEditorAudio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { node: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NodeEditorAudio",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*node*/ ctx[0] === undefined && !("node" in props)) {
    			console_1$3.warn("<NodeEditorAudio> was created without expected prop 'node'");
    		}
    	}

    	get node() {
    		throw new Error("<NodeEditorAudio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<NodeEditorAudio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/NodeEditorAddress.svelte generated by Svelte v3.16.6 */
    const file$7 = "src/NodeEditorAddress.svelte";

    // (11:0) {#if node}
    function create_if_block$7(ctx) {
    	let div;
    	let p0;
    	let input0;
    	let t0;
    	let p1;
    	let input1;
    	let t1;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			input0 = element("input");
    			t0 = space();
    			p1 = element("p");
    			input1 = element("input");
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Street");
    			add_location(input0, file$7, 12, 4, 142);
    			add_location(p0, file$7, 12, 1, 139);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "City");
    			add_location(input1, file$7, 13, 4, 225);
    			add_location(p1, file$7, 13, 1, 222);
    			add_location(div, file$7, 11, 0, 132);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[4])
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, input0);
    			set_input_value(input0, /*node*/ ctx[0].address.street);
    			append_dev(div, t0);
    			append_dev(div, p1);
    			append_dev(p1, input1);
    			set_input_value(input1, /*node*/ ctx[0].address.city);
    			append_dev(div, t1);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*node*/ 1 && input0.value !== /*node*/ ctx[0].address.street) {
    				set_input_value(input0, /*node*/ ctx[0].address.street);
    			}

    			if (dirty & /*node*/ 1 && input1.value !== /*node*/ ctx[0].address.city) {
    				set_input_value(input1, /*node*/ ctx[0].address.city);
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(11:0) {#if node}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*node*/ ctx[0] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*node*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { node } = $$props;
    	const writable_props = ["node"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NodeEditorAddress> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function input0_input_handler() {
    		node.address.street = this.value;
    		$$invalidate(0, node);
    	}

    	function input1_input_handler() {
    		node.address.city = this.value;
    		$$invalidate(0, node);
    	}

    	$$self.$set = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { node };
    	};

    	$$self.$inject_state = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*node*/ 1) {
    			 {
    				updateNode(node);
    			}
    		}
    	};

    	return [node, $$scope, $$slots, input0_input_handler, input1_input_handler];
    }

    class NodeEditorAddress extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { node: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NodeEditorAddress",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*node*/ ctx[0] === undefined && !("node" in props)) {
    			console.warn("<NodeEditorAddress> was created without expected prop 'node'");
    		}
    	}

    	get node() {
    		throw new Error("<NodeEditorAddress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<NodeEditorAddress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/NodeEditorYoutube.svelte generated by Svelte v3.16.6 */

    const { console: console_1$4 } = globals;
    const file$8 = "src/NodeEditorYoutube.svelte";

    // (58:0) {#if node}
    function create_if_block$8(ctx) {
    	let t0;
    	let input;
    	let br;
    	let t1;
    	let t2;
    	let iframe;
    	let iframe_src_value;
    	let dispose;
    	let if_block = /*node*/ ctx[0].image === undefined && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			t0 = text("Embed URL  ");
    			input = element("input");
    			br = element("br");
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			iframe = element("iframe");
    			attr_dev(input, "type", "text");
    			add_location(input, file$8, 60, 13, 1019);
    			add_location(br, file$8, 60, 55, 1061);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "315");
    			if (iframe.src !== (iframe_src_value = /*node*/ ctx[0].src)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$8, 70, 3, 1251);
    			dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*node*/ ctx[0].src);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*node*/ 1 && input.value !== /*node*/ ctx[0].src) {
    				set_input_value(input, /*node*/ ctx[0].src);
    			}

    			if (/*node*/ ctx[0].image === undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*node*/ 1 && iframe.src !== (iframe_src_value = /*node*/ ctx[0].src)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(iframe);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(58:0) {#if node}",
    		ctx
    	});

    	return block;
    }

    // (63:2) {#if node.image===undefined}
    function create_if_block_1(ctx) {
    	let t0;
    	let input;
    	let t1;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text("Video URL  ");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "Grab video thumbnail";
    			attr_dev(input, "type", "text");
    			add_location(input, file$8, 63, 13, 1113);
    			add_location(button, file$8, 63, 57, 1157);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler_1*/ ctx[5]),
    				listen_dev(button, "click", /*setImageFromEmbeddedVideo*/ ctx[2], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*videoUrl*/ ctx[1]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videoUrl*/ 2 && input.value !== /*videoUrl*/ ctx[1]) {
    				set_input_value(input, /*videoUrl*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(63:2) {#if node.image===undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*node*/ ctx[0] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*node*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { node } = $$props;
    	let src = "https://www.youtube.com/embed/J8vz1D_L_OE";

    	function setImageFromEmbeddedVideo() {
    		let url = new URL(videoUrl);

    		if (url) {
    			let thumbUrl = "https://img.youtube.com/vi" + url.pathname + "/0.jpg";
    			console.log("setImageFrom..Video", thumbUrl);
    			$$invalidate(0, node.image = thumbUrl, node);
    			$$invalidate(0, node.shape = "circularImage", node);
    		}
    	}

    	let videoUrl;
    	const writable_props = ["node"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<NodeEditorYoutube> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		node.src = this.value;
    		$$invalidate(0, node);
    	}

    	function input_input_handler_1() {
    		videoUrl = this.value;
    		$$invalidate(1, videoUrl);
    	}

    	$$self.$set = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    	};

    	$$self.$capture_state = () => {
    		return { node, src, videoUrl };
    	};

    	$$self.$inject_state = $$props => {
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    		if ("src" in $$props) src = $$props.src;
    		if ("videoUrl" in $$props) $$invalidate(1, videoUrl = $$props.videoUrl);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*node*/ 1) {
    			 {
    				updateNode(node);
    				console.log("updateNode");
    			}
    		}
    	};

    	return [
    		node,
    		videoUrl,
    		setImageFromEmbeddedVideo,
    		src,
    		input_input_handler,
    		input_input_handler_1
    	];
    }

    class NodeEditorYoutube extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { node: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NodeEditorYoutube",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*node*/ ctx[0] === undefined && !("node" in props)) {
    			console_1$4.warn("<NodeEditorYoutube> was created without expected prop 'node'");
    		}
    	}

    	get node() {
    		throw new Error("<NodeEditorYoutube>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<NodeEditorYoutube>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/GraphData.svelte generated by Svelte v3.16.6 */

    const { console: console_1$5 } = globals;
    const file$9 = "src/GraphData.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (102:0) {#each storeKeys as key}
    function create_each_block(ctx) {
    	let button;
    	let t0_value = /*key*/ ctx[12] + "";
    	let t0;
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(" ");
    			add_location(button, file$9, 102, 3, 2742);

    			dispose = listen_dev(
    				button,
    				"click",
    				function () {
    					/*restore2*/ ctx[5](/*key*/ ctx[12]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*storeKeys*/ 2 && t0_value !== (t0_value = /*key*/ ctx[12] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(102:0) {#each storeKeys as key}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let p0;
    	let input0;
    	let t1;
    	let p1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let input1;
    	let t8;
    	let p2;
    	let t10;
    	let each_1_anchor;
    	let dispose;
    	let each_value = /*storeKeys*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Store name";
    			input0 = element("input");
    			t1 = space();
    			p1 = element("p");
    			button0 = element("button");
    			button0.textContent = "Save";
    			t3 = text(" \r\n   ");
    			button1 = element("button");
    			button1.textContent = "Delete";
    			t5 = text(" \r\n   ");
    			button2 = element("button");
    			button2.textContent = "Download";
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			p2 = element("p");
    			p2.textContent = "Stores";
    			t10 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(p0, file$9, 85, 0, 2255);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$9, 85, 17, 2272);
    			add_location(button0, file$9, 87, 3, 2325);
    			add_location(button1, file$9, 88, 3, 2374);
    			add_location(button2, file$9, 89, 3, 2431);
    			add_location(p1, file$9, 86, 0, 2317);
    			attr_dev(input1, "type", "file");
    			attr_dev(input1, "accept", "application/JSON");
    			attr_dev(input1, "class", "w-full h-full cursor-pointer");
    			add_location(input1, file$9, 92, 1, 2496);
    			add_location(p2, file$9, 100, 0, 2697);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    				listen_dev(button0, "click", /*store*/ ctx[3], false, false, false),
    				listen_dev(button1, "click", /*deleteEntry*/ ctx[4], false, false, false),
    				listen_dev(button2, "click", /*downloadCurrent*/ ctx[6], false, false, false),
    				listen_dev(input1, "change", /*input1_change_handler*/ ctx[11]),
    				listen_dev(input1, "change", /*changed*/ ctx[7], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*storeName*/ ctx[0]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, button0);
    			append_dev(p1, t3);
    			append_dev(p1, button1);
    			append_dev(p1, t5);
    			append_dev(p1, button2);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, input1, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t10, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*storeName*/ 1 && input0.value !== /*storeName*/ ctx[0]) {
    				set_input_value(input0, /*storeName*/ ctx[0]);
    			}

    			if (dirty & /*restore2, storeKeys*/ 34) {
    				each_value = /*storeKeys*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t10);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function download(filename, text) {
    	var element = document.createElement("a");
    	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    	element.setAttribute("download", filename);
    	element.style.display = "none";
    	document.body.appendChild(element);
    	element.click();
    	document.body.removeChild(element);
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $graph;
    	validate_store(graph, "graph");
    	component_subscribe($$self, graph, $$value => $$invalidate(9, $graph = $$value));
    	let { storeName = "store" } = $$props;
    	let storeGen = 0;
    	let storeKeys = [];

    	function store() {
    		localStorage.setItem(storeName, JSON.stringify($graph));
    		$$invalidate(8, storeGen++, storeGen);
    	}

    	function deleteEntry() {
    		localStorage.removeItem(storeName);
    		$$invalidate(8, storeGen++, storeGen);
    	}

    	function restore2(sn) {
    		var data = JSON.parse(localStorage.getItem(sn));
    		$$invalidate(0, storeName = sn);
    		console.log(data);

    		if (data) {
    			nodes.clear();
    			edges.clear();
    			nodes.update(data.nodes);
    			edges.update(data.edges);
    		}
    	}

    	function downloadCurrent() {
    		download("GraphPad-" + storeName + ".json", JSON.stringify($graph));
    	}

    	let files = [];

    	const changed = event => {
    		$$invalidate(2, files = event.target.files);
    		var reader = new FileReader();
    		reader.onload = handleFileRead;

    		function handleFileRead(event) {
    			localStorage.setItem(file.name, event.target.result);
    			$$invalidate(8, storeGen++, storeGen);
    		}

    		let file = files[0];
    		reader.readAsText(file);
    	};

    	const writable_props = ["storeName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<GraphData> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		storeName = this.value;
    		$$invalidate(0, storeName);
    	}

    	function input1_change_handler() {
    		files = this.files;
    		$$invalidate(2, files);
    	}

    	$$self.$set = $$props => {
    		if ("storeName" in $$props) $$invalidate(0, storeName = $$props.storeName);
    	};

    	$$self.$capture_state = () => {
    		return {
    			storeName,
    			storeGen,
    			storeKeys,
    			files,
    			$graph
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("storeName" in $$props) $$invalidate(0, storeName = $$props.storeName);
    		if ("storeGen" in $$props) $$invalidate(8, storeGen = $$props.storeGen);
    		if ("storeKeys" in $$props) $$invalidate(1, storeKeys = $$props.storeKeys);
    		if ("files" in $$props) $$invalidate(2, files = $$props.files);
    		if ("$graph" in $$props) graph.set($graph = $$props.$graph);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*storeGen, storeKeys*/ 258) {
    			 {

    				
    				$$invalidate(1, storeKeys = []);

    				for (let i = 0; i < localStorage.length; i++) {
    					let key = localStorage.key(i);
    					let value = localStorage.getItem(key);
    					console.log(key, value);
    					storeKeys.push(key);
    				}

    				($$invalidate(1, storeKeys), $$invalidate(8, storeGen));
    			}
    		}
    	};

    	return [
    		storeName,
    		storeKeys,
    		files,
    		store,
    		deleteEntry,
    		restore2,
    		downloadCurrent,
    		changed,
    		storeGen,
    		$graph,
    		input0_input_handler,
    		input1_change_handler
    	];
    }

    class GraphData extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { storeName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GraphData",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get storeName() {
    		throw new Error("<GraphData>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set storeName(value) {
    		throw new Error("<GraphData>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tool.svelte generated by Svelte v3.16.6 */

    const file$a = "src/Tool.svelte";

    function create_fragment$b(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "title svelte-1tv75sz");
    			add_location(div0, file$a, 24, 4, 381);
    			attr_dev(div1, "class", "tool svelte-1tv75sz");
    			add_location(div1, file$a, 23, 0, 358);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { title = "Tool" } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tool> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { title };
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	return [title, $$scope, $$slots];
    }

    class Tool extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tool",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get title() {
    		throw new Error("<Tool>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Tool>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Graph.svelte generated by Svelte v3.16.6 */
    const file$b = "src/Graph.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    // (331:0) <Tool title="View">
    function create_default_slot_6(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Center";
    			add_location(button, file$b, 331, 2, 8586);
    			dispose = listen_dev(button, "click", /*fit*/ ctx[17], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(331:0) <Tool title=\\\"View\\\">",
    		ctx
    	});

    	return block;
    }

    // (338:0) {#if canAddNode && !canEditEdge}
    function create_if_block_6(ctx) {
    	let current;

    	const tool = new Tool({
    			props: {
    				title: "Graph",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tool.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tool, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tool_changes = {};

    			if (dirty[0] & /*canDeleteNodes, nodesSelected*/ 264 | dirty[1] & /*$$scope*/ 4) {
    				tool_changes.$$scope = { dirty, ctx };
    			}

    			tool.$set(tool_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tool.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tool.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tool, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(338:0) {#if canAddNode && !canEditEdge}",
    		ctx
    	});

    	return block;
    }

    // (341:2) {#if canDeleteNodes}
    function create_if_block_7(ctx) {
    	let button;
    	let t0;
    	let t1_value = (/*nodesSelected*/ ctx[3] > 1 ? "(s)" : "") + "";
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Delete node");
    			t1 = text(t1_value);
    			add_location(button, file$b, 341, 4, 8803);
    			dispose = listen_dev(button, "click", /*deleteNodes*/ ctx[14], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*nodesSelected*/ 8 && t1_value !== (t1_value = (/*nodesSelected*/ ctx[3] > 1 ? "(s)" : "") + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(341:2) {#if canDeleteNodes}",
    		ctx
    	});

    	return block;
    }

    // (339:2) <Tool title="Graph">
    function create_default_slot_5(ctx) {
    	let button;
    	let t1;
    	let if_block_anchor;
    	let dispose;
    	let if_block = /*canDeleteNodes*/ ctx[8] && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "New node";
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(button, file$b, 339, 3, 8728);
    			dispose = listen_dev(button, "click", /*addNewNode*/ ctx[15], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*canDeleteNodes*/ ctx[8]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_7(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(339:2) <Tool title=\\\"Graph\\\">",
    		ctx
    	});

    	return block;
    }

    // (349:0) {#if canAddEdge | canEditEdge | canDeleteEdge}
    function create_if_block_2(ctx) {
    	let current;

    	const tool = new Tool({
    			props: {
    				title: "Graph",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tool.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tool, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tool_changes = {};

    			if (dirty[0] & /*canEditEdge, edgeEditors, edge1, canDeleteEdge, canAddEdge*/ 2274 | dirty[1] & /*$$scope*/ 4) {
    				tool_changes.$$scope = { dirty, ctx };
    			}

    			tool.$set(tool_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tool.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tool.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tool, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(349:0) {#if canAddEdge | canEditEdge | canDeleteEdge}",
    		ctx
    	});

    	return block;
    }

    // (351:1) {#if canAddEdge}
    function create_if_block_5(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Add Edge";
    			add_location(button, file$b, 351, 4, 9007);
    			dispose = listen_dev(button, "click", /*addNewEdge*/ ctx[12], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(351:1) {#if canAddEdge}",
    		ctx
    	});

    	return block;
    }

    // (355:2) {#if canDeleteEdge}
    function create_if_block_4(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Delete Edge";
    			add_location(button, file$b, 355, 4, 9090);
    			dispose = listen_dev(button, "click", /*deleteEdge*/ ctx[13], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(355:2) {#if canDeleteEdge}",
    		ctx
    	});

    	return block;
    }

    // (360:2) {#if canEditEdge}
    function create_if_block_3(ctx) {
    	let current;

    	const tool = new Tool({
    			props: {
    				title: "Edge",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tool.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tool, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tool_changes = {};

    			if (dirty[0] & /*edgeEditors, edge1*/ 34 | dirty[1] & /*$$scope*/ 4) {
    				tool_changes.$$scope = { dirty, ctx };
    			}

    			tool.$set(tool_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tool.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tool.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tool, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(360:2) {#if canEditEdge}",
    		ctx
    	});

    	return block;
    }

    // (363:6) {#each edgeEditors as editor}
    function create_each_block_1(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*editor*/ ctx[28];

    	function switch_props(ctx) {
    		return {
    			props: { edge: /*edge1*/ ctx[5][0] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty[0] & /*edge1*/ 32) switch_instance_changes.edge = /*edge1*/ ctx[5][0];

    			if (switch_value !== (switch_value = /*editor*/ ctx[28])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(363:6) {#each edgeEditors as editor}",
    		ctx
    	});

    	return block;
    }

    // (361:4) <Tool title = "Edge">
    function create_default_slot_4(ctx) {
    	let t;
    	let each_1_anchor;
    	let current;

    	const edgeeditor = new EdgeEditor({
    			props: { edge: /*edge1*/ ctx[5][0] },
    			$$inline: true
    		});

    	let each_value_1 = /*edgeEditors*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			create_component(edgeeditor.$$.fragment);
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(edgeeditor, target, anchor);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const edgeeditor_changes = {};
    			if (dirty[0] & /*edge1*/ 32) edgeeditor_changes.edge = /*edge1*/ ctx[5][0];
    			edgeeditor.$set(edgeeditor_changes);

    			if (dirty[0] & /*edgeEditors, edge1*/ 34) {
    				each_value_1 = /*edgeEditors*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(edgeeditor.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(edgeeditor.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(edgeeditor, detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(361:4) <Tool title = \\\"Edge\\\">",
    		ctx
    	});

    	return block;
    }

    // (350:1) <Tool title="Graph">
    function create_default_slot_3(ctx) {
    	let t0;
    	let t1;
    	let if_block2_anchor;
    	let current;
    	let if_block0 = /*canAddEdge*/ ctx[6] && create_if_block_5(ctx);
    	let if_block1 = /*canDeleteEdge*/ ctx[7] && create_if_block_4(ctx);
    	let if_block2 = /*canEditEdge*/ ctx[11] && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*canAddEdge*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*canDeleteEdge*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*canEditEdge*/ ctx[11]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block_3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(350:1) <Tool title=\\\"Graph\\\">",
    		ctx
    	});

    	return block;
    }

    // (371:2) {#if canEditNode}
    function create_if_block_1$1(ctx) {
    	let current;

    	const tool = new Tool({
    			props: {
    				title: "Node",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tool.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tool, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tool_changes = {};

    			if (dirty[0] & /*node1, nodeEditors*/ 17 | dirty[1] & /*$$scope*/ 4) {
    				tool_changes.$$scope = { dirty, ctx };
    			}

    			tool.$set(tool_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tool.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tool.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tool, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(371:2) {#if canEditNode}",
    		ctx
    	});

    	return block;
    }

    // (379:6) {#each nodeEditors as editor}
    function create_each_block$1(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*editor*/ ctx[28];

    	function switch_props(ctx) {
    		return {
    			props: { node: /*node1*/ ctx[4][0] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty[0] & /*node1*/ 16) switch_instance_changes.node = /*node1*/ ctx[4][0];

    			if (switch_value !== (switch_value = /*editor*/ ctx[28])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(379:6) {#each nodeEditors as editor}",
    		ctx
    	});

    	return block;
    }

    // (374:6) <NodeEditor node={node1[0]} >
    function create_default_slot_2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*nodeEditors*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*nodeEditors, node1*/ 17) {
    				each_value = /*nodeEditors*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(374:6) <NodeEditor node={node1[0]} >",
    		ctx
    	});

    	return block;
    }

    // (372:4) <Tool title = "Node">
    function create_default_slot_1(ctx) {
    	let current;

    	const nodeeditor = new NodeEditor({
    			props: {
    				node: /*node1*/ ctx[4][0],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(nodeeditor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(nodeeditor, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const nodeeditor_changes = {};
    			if (dirty[0] & /*node1*/ 16) nodeeditor_changes.node = /*node1*/ ctx[4][0];

    			if (dirty[0] & /*nodeEditors, node1*/ 17 | dirty[1] & /*$$scope*/ 4) {
    				nodeeditor_changes.$$scope = { dirty, ctx };
    			}

    			nodeeditor.$set(nodeeditor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nodeeditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nodeeditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(nodeeditor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(372:4) <Tool title = \\\"Node\\\">",
    		ctx
    	});

    	return block;
    }

    // (389:2) {#if !canEditNode && !canEditEdge}
    function create_if_block$9(ctx) {
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let current;
    	let dispose;

    	const tool = new Tool({
    			props: {
    				title: "Data",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tool.$$.fragment);
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "New document";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "New Single Account";
    			add_location(button0, file$b, 392, 4, 10001);
    			add_location(button1, file$b, 393, 4, 10065);

    			dispose = [
    				listen_dev(button0, "click", /*addNewDocumentNode*/ ctx[16], false, false, false),
    				listen_dev(button1, "click", addNewSingleAccount, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			mount_component(tool, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button1, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tool_changes = {};

    			if (dirty[1] & /*$$scope*/ 4) {
    				tool_changes.$$scope = { dirty, ctx };
    			}

    			tool.$set(tool_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tool.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tool.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tool, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(389:2) {#if !canEditNode && !canEditEdge}",
    		ctx
    	});

    	return block;
    }

    // (390:4) <Tool title="Data">
    function create_default_slot(ctx) {
    	let current;
    	const graphdata = new GraphData({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(graphdata.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(graphdata, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(graphdata.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(graphdata.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(graphdata, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(390:4) <Tool title=\\\"Data\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let current;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[27]);

    	const tool = new Tool({
    			props: {
    				title: "View",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block0 = /*canAddNode*/ ctx[9] && !/*canEditEdge*/ ctx[11] && create_if_block_6(ctx);
    	let if_block1 = /*canAddEdge*/ ctx[6] | /*canEditEdge*/ ctx[11] | /*canDeleteEdge*/ ctx[7] && create_if_block_2(ctx);
    	let if_block2 = /*canEditNode*/ ctx[10] && create_if_block_1$1(ctx);
    	let if_block3 = !/*canEditNode*/ ctx[10] && !/*canEditEdge*/ ctx[11] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(tool.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			if (if_block3) if_block3.c();
    			t4 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "l0 editZone svelte-185z0jt");
    			add_location(div0, file$b, 328, 0, 8537);
    			attr_dev(div1, "id", "mynet");
    			attr_dev(div1, "class", "graph svelte-185z0jt");
    			set_style(div1, "height", /*inh*/ ctx[2] + 2 + "px");
    			add_location(div1, file$b, 397, 0, 10149);
    			dispose = listen_dev(window, "resize", /*onwindowresize*/ ctx[27]);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(tool, div0, null);
    			append_dev(div0, t0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t1);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t2);
    			if (if_block2) if_block2.m(div0, null);
    			append_dev(div0, t3);
    			if (if_block3) if_block3.m(div0, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tool_changes = {};

    			if (dirty[1] & /*$$scope*/ 4) {
    				tool_changes.$$scope = { dirty, ctx };
    			}

    			tool.$set(tool_changes);

    			if (/*canAddNode*/ ctx[9] && !/*canEditEdge*/ ctx[11]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*canAddEdge*/ ctx[6] | /*canEditEdge*/ ctx[11] | /*canDeleteEdge*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*canEditNode*/ ctx[10]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div0, t3);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!/*canEditNode*/ ctx[10] && !/*canEditEdge*/ ctx[11]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    					transition_in(if_block3, 1);
    				} else {
    					if_block3 = create_if_block$9(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div0, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*inh*/ 4) {
    				set_style(div1, "height", /*inh*/ ctx[2] + 2 + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tool.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tool.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(tool);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function sampleDocumentNode() {
    	return { nodeClass: "Document" };
    }

    function sampleIdDocumentNode() {
    	return {
    		shape: "image",
    		size: 45,
    		image: "./Austrian_ID_card.jpg"
    	};
    }

    function sampleLegalDocumentNode() {
    	return {
    		shape: "image",
    		size: 45,
    		image: "./contract-signing.png"
    	};
    }

    function addNewSingleAccount() {
    	nodes.clear();
    	edges.clear();

    	addNode([
    		{
    			id: "sa_mandate",
    			label: "Single\nAccount"
    		},
    		{ id: "sa_ah1", label: "Account\nHolder" },
    		{ id: "sa_bo1", label: "Beneficial\nOwner" },
    		{ id: "sa_np1", label: "Natural\nPerson" },
    		{
    			id: "sa_np1_id",
    			label: "ID Card",
    			nodeClass: "Document",
    			...sampleIdDocumentNode()
    		},
    		{
    			id: "sa_ah1_doc0",
    			label: "Form 0",
    			nodeClass: "Document",
    			...sampleLegalDocumentNode()
    		},
    		{
    			id: "sa_bo1_doc4",
    			label: "Form 4",
    			nodeClass: "Document",
    			...sampleLegalDocumentNode()
    		}
    	]);

    	addEdge([
    		{ from: "sa_mandate", to: "sa_ah1" },
    		{ from: "sa_mandate", to: "sa_bo1" },
    		{ from: "sa_ah1", to: "sa_np1" },
    		{ from: "sa_bo1", to: "sa_np1" },
    		{ from: "sa_np1", to: "sa_np1_id" },
    		{ from: "sa_ah1", to: "sa_ah1_doc0" },
    		{ from: "sa_bo1", to: "sa_bo1_doc4" }
    	]);
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let container = {
    		EdgeEditor,
    		NodeEditor,
    		NodeEditorDocument,
    		NodeEditorValidator,
    		NodeEditorValidatorAccepted,
    		NodeEditorValidatorAccepted,
    		NodeEditorValidatorRejected,
    		NodeEditorAudio,
    		NodeEditorAddress,
    		NodeEditorYoutube
    	};

    	let selection = { nodes: [], edges: [] };
    	let nodeEditors = [NodeEditor];
    	let edgeEditors = [EdgeEditor];
    	let nodeChangeSignal = 0;
    	let edgeChangeSignal = 0;
    	let inh;
    	let inw;
    	var data = { nodes, edges };

    	let options = {
    		physics: {
    			enabled: true,
    			barnesHut: {
    				gravitationalConstant: -2000,
    				centralGravity: 0.3,
    				springLength: 95,
    				springConstant: 0.04,
    				damping: 0.09,
    				avoidOverlap: 0
    			}
    		},
    		autoResize: true,
    		height: "100%",
    		width: "100%",
    		interaction: { multiselect: true },
    		nodes: {
    			font: { color: "#ffffff" },
    			shapeProperties: {
    				useBorderWithImage: false,
    				interpolation: true
    			},
    			color: "#0077C8"
    		},
    		edges: { smooth: { enabled: false } }
    	};

    	let network;

    	onMount(async () => {
    		var container = document.getElementById("mynet");
    		network = new AT(container, data, options);

    		network.on("select", function (params) {
    			$$invalidate(18, selection = params);
    		});

    		let nodeUpdating = false;

    		nodes.on("update", function (event, properties, senderId) {
    			if (!nodeUpdating) {
    				nodeUpdating = true;
    				let view = buildNodeView(properties.data[0]);
    				let node = { ...properties.data[0], ...view };
    				updateNode(node);
    				$$invalidate(19, nodeChangeSignal++, nodeChangeSignal);
    				nodeUpdating = false;
    			}
    		});

    		let edgeUpdating = false;

    		edges.on("update", function (event, properties, senderId) {
    			if (!edgeUpdating) {
    				edgeUpdating = true;
    				let view = buildEdgeView(properties.data[0]);
    				let edge = { ...properties.data[0], ...view };
    				updateEdge(edge);
    				$$invalidate(20, edgeChangeSignal++, edgeChangeSignal);
    				edgeUpdating = false;
    			}
    		});

    		setTimeout(
    			() => {
    				network.fit();
    			},
    			1000
    		);
    	});

    	function addNewEdge() {
    		if (nodesSelected === 2) {
    			addEdge({
    				from: node1[0].id,
    				to: node2[0].id,
    				label: ""
    			});
    		}
    	}

    	function deleteEdge() {
    		removeEdge(edge1[0]);
    		$$invalidate(18, selection.edges = [], selection);
    	}

    	function deleteNodes() {
    		removeEdge(selection.edges);
    		removeNode(selection.nodes);
    	}

    	function addNewNode(attr, edgeattr) {
    		if (nodesSelected <= 1) {
    			var newNode = addNode({ label: "New\nNode", ...attr });

    			if (nodesSelected === 1) {
    				var newEdge = addEdge({
    					from: node1[0].id,
    					to: newNode[0],
    					label: "",
    					...edgeattr
    				});

    				$$invalidate(18, selection.edges = [], selection);
    			}

    			$$invalidate(18, selection.nodes = newNode, selection);
    			network.selectNodes(newNode);
    		}
    	}

    	

    	function addNewDocumentNode() {
    		addNewNode(
    			{
    				...sampleDocumentNode(),
    				nodeClass: "Document"
    			},
    			{}
    		);
    	}

    	function fit() {
    		network.fit();
    	}

    	function onwindowresize() {
    		$$invalidate(2, inh = window.innerHeight);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("container" in $$props) $$invalidate(23, container = $$props.container);
    		if ("selection" in $$props) $$invalidate(18, selection = $$props.selection);
    		if ("nodeEditors" in $$props) $$invalidate(0, nodeEditors = $$props.nodeEditors);
    		if ("edgeEditors" in $$props) $$invalidate(1, edgeEditors = $$props.edgeEditors);
    		if ("nodeChangeSignal" in $$props) $$invalidate(19, nodeChangeSignal = $$props.nodeChangeSignal);
    		if ("edgeChangeSignal" in $$props) $$invalidate(20, edgeChangeSignal = $$props.edgeChangeSignal);
    		if ("inh" in $$props) $$invalidate(2, inh = $$props.inh);
    		if ("inw" in $$props) inw = $$props.inw;
    		if ("data" in $$props) data = $$props.data;
    		if ("options" in $$props) options = $$props.options;
    		if ("network" in $$props) network = $$props.network;
    		if ("nodesSelected" in $$props) $$invalidate(3, nodesSelected = $$props.nodesSelected);
    		if ("node1" in $$props) $$invalidate(4, node1 = $$props.node1);
    		if ("node2" in $$props) node2 = $$props.node2;
    		if ("edge1" in $$props) $$invalidate(5, edge1 = $$props.edge1);
    		if ("canAddEdge" in $$props) $$invalidate(6, canAddEdge = $$props.canAddEdge);
    		if ("canDeleteEdge" in $$props) $$invalidate(7, canDeleteEdge = $$props.canDeleteEdge);
    		if ("canDeleteNodes" in $$props) $$invalidate(8, canDeleteNodes = $$props.canDeleteNodes);
    		if ("canAddNode" in $$props) $$invalidate(9, canAddNode = $$props.canAddNode);
    		if ("canEditNode" in $$props) $$invalidate(10, canEditNode = $$props.canEditNode);
    		if ("canEditEdge" in $$props) $$invalidate(11, canEditEdge = $$props.canEditEdge);
    	};

    	let nodesSelected;
    	let node1;
    	let node2;
    	let edge1;
    	let canAddEdge;
    	let canDeleteEdge;
    	let canDeleteNodes;
    	let canAddNode;
    	let canEditNode;
    	let canEditEdge;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*selection*/ 262144) {
    			 $$invalidate(3, nodesSelected = selection.nodes.length);
    		}

    		if ($$self.$$.dirty[0] & /*selection*/ 262144) {
    			 $$invalidate(4, node1 = nodes.get(selection.nodes.slice(0, 1)));
    		}

    		if ($$self.$$.dirty[0] & /*selection*/ 262144) {
    			 node2 = nodes.get(selection.nodes.slice(1, 2));
    		}

    		if ($$self.$$.dirty[0] & /*selection*/ 262144) {
    			 $$invalidate(5, edge1 = edges.get(selection.edges.slice(0, 1)));
    		}

    		if ($$self.$$.dirty[0] & /*selection*/ 262144) {
    			 $$invalidate(6, canAddEdge = selection.nodes.length === 2);
    		}

    		if ($$self.$$.dirty[0] & /*selection*/ 262144) {
    			 $$invalidate(7, canDeleteEdge = selection.nodes.length === 0 && selection.edges.length === 1);
    		}

    		if ($$self.$$.dirty[0] & /*selection*/ 262144) {
    			 $$invalidate(8, canDeleteNodes = selection.nodes.length > 0);
    		}

    		if ($$self.$$.dirty[0] & /*selection*/ 262144) {
    			 $$invalidate(9, canAddNode = selection.nodes.length <= 1);
    		}

    		if ($$self.$$.dirty[0] & /*selection*/ 262144) {
    			 $$invalidate(10, canEditNode = selection.nodes.length === 1);
    		}

    		if ($$self.$$.dirty[0] & /*selection, canEditNode*/ 263168) {
    			 $$invalidate(11, canEditEdge = selection.edges.length === 1 && !canEditNode);
    		}

    		if ($$self.$$.dirty[0] & /*canEditNode, nodeChangeSignal, node1*/ 525328) {
    			 {
    				if (canEditNode) {
    					let editor = null;
    					let editors = [];

    					if (node1[0].nodeClass) {
    						editor = container["NodeEditor" + node1[0].nodeClass];
    						let tokens = node1[0].nodeClass.split(" ");
    						console.log(tokens);

    						tokens.forEach(t => {
    							let e = container["NodeEditor" + t];

    							if (t !== "") {
    								editors.push(e);
    							}
    						});
    					}

    					$$invalidate(0, nodeEditors = [...editors]);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*canEditEdge, edgeChangeSignal, edge1*/ 1050656) {
    			 {
    				if (canEditEdge) {
    					let editor = null;
    					let editors = [];

    					if (edge1[0].nodeClass) {
    						editor = container["EdgeEditor" + edge1[0].edgeClass];
    						let tokens = edge1[0].edgeClass.split(" ");
    						console.log(tokens);

    						tokens.forEach(t => {
    							let e = container["EdgeEditor" + t];

    							if (t !== "") {
    								editors.push(e);
    							}
    						});
    					}

    					$$invalidate(1, edgeEditors = [...editors]);
    				}
    			}
    		}
    	};

    	return [
    		nodeEditors,
    		edgeEditors,
    		inh,
    		nodesSelected,
    		node1,
    		edge1,
    		canAddEdge,
    		canDeleteEdge,
    		canDeleteNodes,
    		canAddNode,
    		canEditNode,
    		canEditEdge,
    		addNewEdge,
    		deleteEdge,
    		deleteNodes,
    		addNewNode,
    		addNewDocumentNode,
    		fit,
    		selection,
    		nodeChangeSignal,
    		edgeChangeSignal,
    		network,
    		node2,
    		container,
    		inw,
    		data,
    		options,
    		onwindowresize
    	];
    }

    class Graph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graph",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.6 */

    function create_fragment$d(ctx) {
    	let current;
    	const graph = new Graph({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(graph.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(graph, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(graph.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(graph.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(graph, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
