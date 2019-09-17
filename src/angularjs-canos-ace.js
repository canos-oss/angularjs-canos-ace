function AceDirective() {

    return {
        restrict: 'E',
        template: '<div>{\n}</div>',
        replace: true,
        scope: {},
        link: function (scope, element, attrs) {

            var item = element[0];
            item.style.height = '200px';

            scope.thisEditor = ace.edit(item);
            scope.thisEditor.setFontSize(16);
            scope.thisEditor.session.setMode("ace/mode/json");
        }
    }
}

function Ace2Directive() {

    return {
        restrict: 'EA',
        template: '<div>{\n}</div>',
        replace: true,
        scope: {},
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {

            // #region ngModel
            /**
             * In most of the cases, $parsers is the right option to handle the logic of custom validation.
             * Functions added to $parsers are called as soon as the value in the form input is modified by the user.
             */
            function _ngmodel_parser(viewValue) {
                return viewValue;
            }

            /**
             * Formatters are invoked when the model is modified in the code.
             * They are not invoked if the value is modified in the textbox.
             * $formatters are useful when there is a possibility of the value getting modified from the code.
             */
            function _ngmodel_formatter(value) {
                if (angular.isUndefined(value) || value === null) {
                    return '';
                }
                else if (angular.isObject(value) || angular.isArray(value)) {
                    throw new Error('ui-ace cannot use an object or an array as a model');
                }
                return value;
            }

            /**
             * Called when the view needs to be updated. It is expected that the user of the ng-model directive will implement this method.
             */
            function _ngmodel_render() {
                thisEditor.getSession().setValue(ngModel.$viewValue);
            }

            if (ngModel != null) {
                ngModel.$parsers.push(_ngmodel_parser);
                ngModel.$formatters.push(_ngmodel_formatter);
                ngModel.$render = _ngmodel_render;
            }

            // #endregion

            //设置外观
            element[0].style.height = '200px';

            //初始化编辑器
            var thisEditor = window.ace.edit(element[0]);
            thisEditor.setFontSize(16);

            thisEditor.getSession().setMode("ace/mode/json");
            thisEditor.getSession().on('change', function (e) {
                var newValue = thisEditor.getSession().getValue();
                if (ngModel && newValue !== ngModel.$viewValue &&
                    // HACK make sure to only trigger the apply outside of the digest loop 'cause ACE is actually using this callback for any text transformation !
                    !scope.$$phase && !scope.$root.$$phase) {
                    scope.$evalAsync(function () {
                        ngModel.$setViewValue(newValue);
                    });
                }
            });

            //销毁事件
            element.on('$destroy', function () {
                thisEditor.getSession().$stopWorker();
                thisEditor.destroy();
            });

            attrs.$observe('readonly', function (value) {
                thisEditor.setReadOnly(!!value || value === '');
            });

            scope.$watch(function () {
                return [element[0].offsetWidth, element[0].offsetHeight];
            }, function () {
                thisEditor.resize();
                thisEditor.renderer.updateFull();
            }, true);
        }
    }
}
