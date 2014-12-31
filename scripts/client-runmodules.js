'use strict';

window.addEventListener('load', function runModules() {
    var module;
    var moduleName;
    var modules = window.document.querySelectorAll('[data-module]');

    // Run module scripts against each module element
    for (var i=0, len=modules.length; i<len; i+=1) {
        module = modules[i];
        moduleName = module.getAttribute('data-module');
        modules[i].removeAttribute('data-module');
        require(moduleName)(module);
    }
});