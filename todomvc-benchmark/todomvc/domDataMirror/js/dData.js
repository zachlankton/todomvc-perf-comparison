/*
        d-data web directive
        written by: Zach Lankton & Gavin McGraw 2017       
*/

dData = {};  // dData Global Object
dData.extensions = []; // An array to store d-data extensions

function registerDData(dDataProto){
        
    if (dDataProto.hasOwnProperty("value") ){return 0; /* this element has already been registered */ }
    
    // these are the core properties of d-data which provide its main functionality
    Object.defineProperty(dDataProto, "value", { get: valueGetter, set: dataRender, enumerable: true }  );
    Object.defineProperty(dDataProto, "valueElementTree", { get: valueElementTree}  );
    Object.defineProperty(dDataProto, "name", { get: nameAttributeGetter,   set: nameAttributeSetter });

    // these are the public methods that are available on an element with the d-data attribute
    dDataProto.add = addSibling;
    dDataProto.remove = removeSibling;

    // these are public utility functions for working with descendant elements of d-data elements
    // these are available in the global dData Object and can be used by extensions or any other custom code
    dData.findRootDData = findRootDData;
    dData.findNearestDDataParent = findNearestDDataParent;
    dData.findTemplateParent = findTemplateParent;

    // Initialize this element
    init(dDataProto);

    function init(dDataProto){
        // all elements with the d-data attribute need a name attribute
        if (dDataProto.getAttribute("name") == "") {throw ("d-data elements require a name attribute")}

        // we can only setup child templates on elements that are connected to the dom, becuase they need a parentElement
        if (dDataProto.isConnected){
            if (!dDataProto.parentElement.childTemplates){ dDataProto.parentElement.childTemplates = {}; } 
            dDataProto.parentElement.childTemplates[dDataProto.getAttribute("name")] = dDataCloneNode(dDataProto);
            dDataProto.parentElement.setAttribute("has-d-data-children", true);
        }  

        setupChildTemplates(dDataProto);

        // Setup any extensions that may be available in dData.extensions
        setupExtensions(dDataProto, dDataProto); 

        // if this is a root d-data element, setup scope and initial data
        setupRootDData(dDataProto);

        // Dispatch Event for builtins to respond to
        var dDataInitEvent = new CustomEvent("dDataInitialized", {bubbles:true});
        dDataProto.dispatchEvent(dDataInitEvent);

    }

    function setupChildTemplates(element){
        var dDataChildren = element.querySelectorAll('[d-data]');
        for (var i=0; i<dDataChildren.length; i++) {
            if (!dDataChildren[i].parentElement.childTemplates){dDataChildren[i].parentElement.childTemplates = {};}
            dDataChildren[i].parentElement.childTemplates[dDataChildren[i].getAttribute('name')] = dDataCloneNode(dDataChildren[i]);  
            dDataChildren[i].parentElement.setAttribute("has-d-data-children", true);
        }
    }

    function setupRootDData(dDataProto){
        if ( findRootDData(dDataProto) == dDataProto ){ 
            
            var scope = dData;      // Setup Scope.
            if ( dDataProto.hasAttribute("scope") ){
                var scope = setupScope(dDataProto);
                var initialData = lookForInitialData(scope, dDataProto);
            }

            Object.defineProperty(scope, dDataProto.name, { get: valueGetter, set: dataRender, enumerable: true } );
            if (initialData) {scope[dDataProto.name] = initialData;}
        } 
    }

    function setupScope(dDataProto){
        
        var scope = dDataProto.getAttribute("scope");
        if (scope == ""){ return window; }
        var paths = scope.split(".");
        var path = window;

        for (i=0; i<paths.length; i++){
            if ( typeof(path[paths[i]])=="undefined" ){
                path[paths[i]] = {};
            }
            path = path[paths[i]];
        }

        return path;
    }

    function lookForInitialData(scope, dDataProto){
        if (scope.hasOwnProperty(dDataProto.name) ){ // Look for initial data on the scope
            return Object.assign({}, scope[dDataProto.name]);
        }
        return false;
    }

    function findRootDData(element){
        var ddRoot = element;
        if (!element.isConnected){return null;}
        while (element = element.parentElement){
            if (element.hasAttribute("d-data") ) {ddRoot = element}
        }
        return ddRoot;
    }

    function findNearestDDataParent(element){
        var ddRoot = element;
        while (element = element.parentElement){
            if (element.hasAttribute("d-data") ) {ddRoot = element; break;}
        }
        return ddRoot;
    }

    function dataRender(v){
        deleteExtraElements(dDataProto);
        renderValues(v, dDataProto);
        renderChildren(v, dDataProto);

        // dispatch dDataRendered Event for Builtins to respond to
        emitDataRendered(dDataProto);
    };

    function emitDataRendered(element){
        var dDataInitEvent = new CustomEvent("dDataRendered", {bubbles:true});
        element.dispatchEvent(dDataInitEvent);
    }

    function deleteExtraElements(element){
        
        var extraElements = element.querySelectorAll("[d-data]");

        for (var i=0; i<extraElements.length; i++){
            var ee = extraElements[i];
            var eeParent = ee.parentElement;
            eeParent.removeChild(ee);
        } 
    }

    function renderValues(values, element){
        var tree = element.valueElementTree;
        for (var key in values){
            if (tree.hasOwnProperty(key)){
                if (tree[key].type == "checkbox" ){
                    tree[key].checked = values[key] == "" ? false : true ;  
                } else if (typeof(tree[key].value) == "string" ){
                    tree[key].value = values[key];    
                } else {
                    tree[key].innerHTML = values[key];    
                }  
            }else if(typeof(values[key]) !== "object" ) {
                var hiddenInput = document.createElement("input");
                hiddenInput.type = "hidden";
                hiddenInput.name = key;
                hiddenInput.value = values[key];
                element.append(hiddenInput);
            }
        }
    }

    function renderValOrHTML(element, value){
        if (element.type == "checkbox" ) {
            element.checked = value == "" ? false : true ;
        } else if (element.value){
            element.value = value;
        }else{
            element.innerHTML = value;
        }
    }

    function renderChildren(value, element){
        for (var key in value){
            if (typeof(value[key]) == "object" && element.parentElement.childTemplates[element.getAttribute("name")].value.hasOwnProperty(key) )  {
                renderList(element, value[key], key);
            } else if (Array.isArray(value[key]) ){
                renderHiddenList(element, value[key], key);
            }
        }
    }

    function renderList(element, value, name){
        for (var i=0; i<value.length; i++){
            element.add(name, value[i]);
        };
    }

    function renderHiddenList(element, value, name){
        var div = document.createElement("div");
        div.setAttribute("d-data", "");
        div.setAttribute("name", name);
        element.append(div);
        registerDData(div);
        element.removeChild(div);
        renderList(element, value, name);
    }

    function addSibling(childName, data){
        if (childName){
            var name = childName;
            var parent = findTemplateParent(dDataProto, name);
            var element = parent.childTemplates[name];
            var clone = dDataCloneNode(element);
        }else{
            var name = dDataProto.getAttribute("name");
            var parent = dDataProto.parentElement;
            var clone = dDataCloneNode(parent.childTemplates[name]);
        }

        var lastSibling = getLastSibling(parent, name);
       
        if (lastSibling){ parent.insertBefore(clone, lastSibling.nextElementSibling); }
       
        else { parent.appendChild(clone); }

        var inpVals = clone.querySelectorAll("[name]"); //clear all values that may have leaked into the template;
        for (var i=0; i<inpVals.length;i++){renderValOrHTML(inpVals[i], ""); }
        
        if(data){ clone.value = data; }

    }

    function removeSibling() {
        var parent = dDataProto.parentElement;
        parent.removeChild(dDataProto);
        emitDataRendered(parent);
    }

    function getLastSibling(parent, name){
        var siblings = parent.querySelectorAll("[name='"+name+"']");
        var lastSiblingIndex = siblings.length - 1;
        return siblings[lastSiblingIndex];
    }

    function findTemplateParent(element, name){
        if ( element.hasAttribute("has-d-data-children") ){
            return element
        }else{
            var templateParent = element.querySelectorAll( "[has-d-data-children]" );
            for (var i=0; i<templateParent.length;i++){
                if (templateParent[i].childTemplates[name]){
                    return templateParent[i];
                    break;
                }
            }   
        }
    }

    function dDataCloneNode(element){
        var clone = element.cloneNode(true);
        return registerDData(clone);
    }
    
    function valueElementTree(){
        return valueGetter(undefined,dDataProto,true);
    }

    function valueGetter(data, element, getElementTree){
        var rootElement = false;
        if (data == undefined){rootElement = true;}
        var data = data || {};
        var element = element || dDataProto;

        for(var i=0; i<element.childElementCount; i++){
            var child = element.children[i];
            evaluateChild(data, child, getElementTree);
        };

        if (rootElement){
            Object.defineProperty(data, "add", {get: function(){
                return element.add;
            } });
        }
        
        return data;
    }

    function evaluateChild(data, child, getElementTree){
        if      (child.hasAttribute("d-data") )     { getNestedDData(data, child, getElementTree)   }
        else if (child.hasAttribute("name"))    { getElementValue(data, child, getElementTree)  }
        else                                    { valueGetter(data, child, getElementTree)  } //descend into child dom elements recursively
    }

    function getNestedDData(data, child, getElementTree){
        if (data[child.getAttribute("name")] == undefined){
            data[child.getAttribute("name")] = [];
            data[child.getAttribute("name")].add = function(data){
                child.add(null, data);
            };
            data[child.getAttribute("name")].remove = function(index){
                child.parentElement.querySelectorAll("[name='"+child.getAttribute("name")+"']")[index].remove();
            }
        }
        if ( getElementTree ){ data[child.getAttribute("name")].push(child.valueElementTree); }
        else { data[child.getAttribute("name")].push(child.value); }
    }

    function getElementValue(data, child, getElementTree){
        child.name = child.name || child.getAttribute("name");
        if ( getElementTree ) { data[child.getAttribute("name")] = child;  }
        else { 
            if (child.type == "checkbox") {
                Object.defineProperty(data, child.getAttribute("name"), {
                    get: function(){ return child.checked; }, 
                    set: function(newVal){ child.checked = newVal; emitDataRendered(child);},
                    enumerable: true,
                }); 
            } else if (typeof(child.value)=="string" ) { 
                Object.defineProperty(data, child.getAttribute("name"), {
                    get: function(){ return child.value; }, 
                    set: function(newVal){ child.value = newVal; emitDataRendered(child);},
                    enumerable: true,
                }); 
            }else{
                Object.defineProperty(data, child.getAttribute("name"), {
                    get: function(){ return child.innerHTML; }, 
                    set: function(newVal){ child.innerHTML = newVal; emitDataRendered(child);},
                    enumerable: true
                }); 
            } 
        } 
    }

    function nameAttributeGetter(){return dDataProto.getAttribute("name") || ""; };
    function nameAttributeSetter(newVal){ dDataProto.setAttribute("name", newVal) };

    function setupExtensions(element, dDataElement){
        // extensions provide additional functionality when a given attribute is present on 
        // any descendant element of d-data, these attributes can be custom or native
        // multiple extensions for the same attribute may be possible, but collisions may occur, this has not been tested
        evaluateElementForExtensions(element, dDataElement);
        var children = element.children;
        for (var i=0; i<children.length; i++){
            var child = children[i];
            if (child.hasAttribute("d-data")){  //then descend no further  
            }else{
                evaluateElementForExtensions(child, dDataElement);
                setupExtensions(child, dDataElement); //continue looking through immediate children
            }
        }
    }

    function evaluateElementForExtensions(element, ddata){
        // extension objects = {attribute: "attribute name", setup: function(element, dData, attributeValue) }
        var ext = dData.extensions
        for (var i=0; i<ext.length; i++){
            if ( element.hasAttribute( ext[i].attribute ) ){ 
                var attrVal = element.getAttribute( ext[i].attribute );
                ext[i].setup(element, ddata, attrVal) 
            }
        }   
    }

    return dDataProto;
}

// this mutation observer watches for elements with the d-data attribute and registers them
var dDataObserver = new MutationObserver(function(mutations){
    if (typeof(mutationDoneTimer) !== "undefined"){
        clearTimeout(mutationDoneTimer)};
        mutationDoneTimer = setTimeout(function(){
            var mutationDoneEvent = new Event("MutationDone");
            document.dispatchEvent(mutationDoneEvent);
        }, 100);
    mutations.forEach(function(mutation){
        if (mutation.type == "childList"){
            mutation.addedNodes.forEach(function(node){
                if (node.nodeType === 1 && node.hasAttribute("d-data") ){
                    registerDData(node);
                }
            });
        }
        if (mutation.type == "attributes"){
            if (mutation.target.nodeType === 1 && mutation.target.hasAttribute("d-data") ){
                registerDData(mutation.target);
            }
            
        }
    });
});


dDataObserver.observe(document, {
    childList: true,
    subtree: true,
    attributeFilter: ['d-data']
});

// EXTENSIONS:

/////////////////////////////////
// COMPUTED PROPERTY EXTENSION //
/////////////////////////////////

( function dDataComputers(){
    
    dData.extensions.push({attribute: "computer", setup: setupComputer});

    document.addEventListener("dDataInitialized", function(event){
        event.target.addEventListener("change", function(event){
            event.stopPropagation();
            runComputers(event.target);
        });
    });
    
    function setupComputer(element, dDataElement){
        
        var computer = eval(element.getAttribute("computer"));
        var dParent = dData.findNearestDDataParent(element);
        var root = dData.findRootDData(element);
        if (!dParent.computedProps){ dParent.computedProps = []; }

        var fun = function(dDataElement, root){
            if (!computer){ return 0; }/* Make sure computer function is defined */ 
            if (element.value){
                element.value = computer( dDataElement, root ) ;
            } else {
                element.innerHTML = computer( dDataElement, root ) ;
            }

        }
        dParent.computedProps.push(fun);

        document.addEventListener("dDataRendered", function(event){ 
            runComputers(element) 
        });
    }


    function runComputers(element){
        var root = dData.findRootDData(element);
        var dDataElement = dData.findNearestDDataParent(element)
        var computers = dDataElement.computedProps
        if (computers){
            for (var i=0; i<computers.length; i++){
                computers[i](dDataElement, root);
            }
        }
    }
})();

///////////////////////
// FILTER  EXTENSION //
///////////////////////

( function dDataFilterExtension(){

    dData.extensions.push({attribute: "filter", setup: setupFilter});

    function setupFilter(filter, dDataElement, attrVal){
        
        filter.addEventListener("keyup", function(event){
            var attrSplit = attrVal.split(":");
            var dataToFilter = attrSplit[0];
            var keyToFilterOn = attrSplit[1];

            var searchKeys = filter.value.split(" ");
            var parent = dData.findNearestDDataParent(filter);
            var children = parent.querySelectorAll("[name='"+dataToFilter+"']");
            for (var i=0; i<children.length; i++){
                var f = filterArr_AND(children[i].value, keyToFilterOn, searchKeys);
                if (f || filter.value == "") {
                    children[i].style.display = "" ;   
                }else{
                    children[i].style.display = "none";
                }

            }
        });      
    }

    function filterArr(obj, keyToFilterOn, searchVal){ 
        // this function will filter a nested array to elements containing searchVal  
        if ( Array.isArray(obj) ){
            var results = []
            for (var i=0; i<obj.length; i++){
                 var r = filterArr( obj[i], keyToFilterOn, searchVal ) 
                 if (r) { results.push(r) }
            }
            if (results.length == 0 ){ return false } else { return results }
        } else if (typeof(obj)=="object" ) {
            var results = {};
            for (var key in obj) {
                if (keyToFilterOn != undefined && key != keyToFilterOn){ continue; }
                var r = filterArr( obj[key], keyToFilterOn, searchVal )
                if (r != undefined) { results[key] = r } 
            }
            if (Object.keys(results).length == 0) { return false } else { return obj }
        } else {
            if (obj != undefined && obj.toString().toLowerCase().indexOf(searchVal.toLowerCase()) > -1 ) { return obj; } else { return undefined; }
        }
    }

    function filterArr_AND(obj, keyToFilterOn, searchKeys){
        // this function will filter a nested array to elements including all search keys
        var results = obj;
        for (var i=0; i<searchKeys.length;i++ ){
            results = filterArr(results, keyToFilterOn, searchKeys[i]);
            if (results.length == 0 || results == false) {break;}
        }
        return results;
    }

})();

///////////
// CLASS //
///////////

( function(){
    
    dData.extensions.push({attribute: "dClass", setup: setupDClass});

    function setupDClass(element, dDataElement, attrVal){
        var attrSplit = attrVal.split(":");
        var className = attrSplit[0];
        var name = attrSplit[1];
        var expression = attrSplit[2];
        dDataElement.valueElementTree[name].addEventListener("change", dClass);
        document.addEventListener("dDataRendered", dClass);

        function dClass(event){
            if (dDataElement.value[name].toString() == expression ){
                element.classList.add(className);
            }else{
                element.classList.remove(className);
            }
            document.removeEventListener("dDataRendered", dClass);
        }

    }

})();

//////////
// SHOW //
//////////

(function(){

    dData.extensions.push({attribute: "show", setup: setupShow});

    function setupShow(element, dDataElement, attrVal){

        document.addEventListener("dDataRendered", showHide);
        dDataElement.addEventListener("change", showHide);

        function showHide(){
            var attrSplit = attrVal.split(".");
            var func = window;
            var i=0;
            while (typeof(func) != "function" ){
                func = func[attrSplit[i]];
                i++;
            }
            element.hidden = func(); 
        }
    }

})();