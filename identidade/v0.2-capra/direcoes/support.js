/*
 * Runtime mínimo para abrir os arquivos .dc.html fora do canvas (navegador ou captura headless).
 * Suporta só o que estas pranchas usam: {{caminho}}, <sc-for>, <sc-if>, <helmet>,
 * data-props (defaults) e class Component extends DCLogic com renderVals().
 */
(function () {
  window.DCLogic = class {
    constructor(props) { this.props = props; this.state = {}; }
    setState(s) { Object.assign(this.state, s); }
    forceUpdate() {}
  };

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, scope);
  }

  function interp(str, scope) {
    return str.replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_, p) {
      var v = lookup(p, scope);
      return v == null ? '' : String(v);
    });
  }

  function processChildren(parent, scope) {
    Array.prototype.slice.call(parent.childNodes).forEach(function (n) { processNode(n, scope); });
  }

  function processNode(node, scope) {
    if (node.nodeType === 3) {
      if (node.nodeValue.indexOf('{{') >= 0) node.nodeValue = interp(node.nodeValue, scope);
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();

    if (tag === 'sc-for') {
      var list = lookup(node.getAttribute('list').replace(/[{}]/g, ''), scope) || [];
      var as = node.getAttribute('as') || 'item';
      var frag = document.createDocumentFragment();
      list.forEach(function (item, i) {
        var s = Object.assign({}, scope); s[as] = item; s.$index = i;
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          var clone = c.cloneNode(true);
          frag.appendChild(clone);
          processNode(clone, s);
        });
      });
      node.parentNode.replaceChild(frag, node);
      return;
    }

    if (tag === 'sc-if') {
      var ok = lookup(node.getAttribute('value').replace(/[{}]/g, ''), scope);
      if (!ok) { node.parentNode.removeChild(node); return; }
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (c) { node.parentNode.insertBefore(c, node); processNode(c, scope); });
      node.parentNode.removeChild(node);
      return;
    }

    Array.prototype.slice.call(node.attributes).forEach(function (a) {
      if (a.value.indexOf('{{') >= 0) node.setAttribute(a.name, interp(a.value, scope));
    });
    processChildren(node, scope);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var script = document.querySelector('script[data-dc-script]');
    var propsDef = JSON.parse(script.getAttribute('data-props') || '{}');
    var props = {};
    Object.keys(propsDef).forEach(function (k) {
      if (k[0] !== '$' && 'default' in propsDef[k]) props[k] = propsDef[k].default;
    });
    var Component = new Function(script.textContent + '\nreturn Component;')();
    var vals = new Component(props).renderVals();

    var root = document.querySelector('x-dc');
    var helmet = root.querySelector('helmet');
    if (helmet) {
      Array.prototype.slice.call(helmet.children).forEach(function (c) {
        var el = document.createElement(c.tagName);
        Array.prototype.slice.call(c.attributes).forEach(function (a) { el.setAttribute(a.name, a.value); });
        el.textContent = c.textContent;
        document.head.appendChild(el);
      });
      helmet.parentNode.removeChild(helmet);
    }
    processChildren(root, vals);
    root.style.display = 'block';
  });
})();
