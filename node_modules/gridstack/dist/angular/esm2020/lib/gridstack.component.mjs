/**
 * gridstack.component.ts 12.2.2
 * Copyright (c) 2022-2024 Alain Dumesny - see GridStack root license
 */
import { Component, ContentChildren, EventEmitter, Input, Output, ViewChild, ViewContainerRef, reflectComponentType } from '@angular/core';
import { NgIf } from '@angular/common';
import { GridStack } from 'gridstack';
import { GridstackItemComponent } from './gridstack-item.component';
import * as i0 from "@angular/core";
/**
 * HTML Component Wrapper for gridstack, in combination with GridstackItemComponent for the items
 */
export class GridstackComponent {
    constructor(elementRef) {
        this.elementRef = elementRef;
        /** individual list of GridStackEvent callbacks handlers as output
         * otherwise use this.grid.on('name1 name2 name3', callback) to handle multiple at once
         * see https://github.com/gridstack/gridstack.js/blob/master/demo/events.js#L4
         *
         * Note: camel casing and 'CB' added at the end to prevent @angular-eslint/no-output-native
         * eg: 'change' would trigger the raw CustomEvent so use different name.
         */
        this.addedCB = new EventEmitter();
        this.changeCB = new EventEmitter();
        this.disableCB = new EventEmitter();
        this.dragCB = new EventEmitter();
        this.dragStartCB = new EventEmitter();
        this.dragStopCB = new EventEmitter();
        this.droppedCB = new EventEmitter();
        this.enableCB = new EventEmitter();
        this.removedCB = new EventEmitter();
        this.resizeCB = new EventEmitter();
        this.resizeStartCB = new EventEmitter();
        this.resizeStopCB = new EventEmitter();
        // set globally our method to create the right widget type
        if (!GridStack.addRemoveCB) {
            GridStack.addRemoveCB = gsCreateNgComponents;
        }
        if (!GridStack.saveCB) {
            GridStack.saveCB = gsSaveAdditionalNgInfo;
        }
        if (!GridStack.updateCB) {
            GridStack.updateCB = gsUpdateNgComponents;
        }
        this.el._gridComp = this;
    }
    /** initial options for creation of the grid */
    set options(o) {
        if (this._grid) {
            this._grid.updateOptions(o);
        }
        else {
            this._options = o;
        }
    }
    /** return the current running options */
    get options() { return this._grid?.opts || this._options || {}; }
    /** return the native element that contains grid specific fields as well */
    get el() { return this.elementRef.nativeElement; }
    /** return the GridStack class */
    get grid() { return this._grid; }
    /** add a list of ng Component to be mapped to selector */
    static addComponentToSelectorType(typeList) {
        typeList.forEach(type => GridstackComponent.selectorToType[GridstackComponent.getSelector(type)] = type);
    }
    /** return the ng Component selector */
    static getSelector(type) {
        return reflectComponentType(type).selector;
    }
    ngOnInit() {
        // init ourself before any template children are created since we track them below anyway - no need to double create+update widgets
        this.loaded = !!this.options?.children?.length;
        this._grid = GridStack.init(this._options, this.el);
        delete this._options; // GS has it now
        this.checkEmpty();
    }
    /** wait until after all DOM is ready to init gridstack children (after angular ngFor and sub-components run first) */
    ngAfterContentInit() {
        // track whenever the children list changes and update the layout...
        this._sub = this.gridstackItems?.changes.subscribe(() => this.updateAll());
        // ...and do this once at least unless we loaded children already
        if (!this.loaded)
            this.updateAll();
        this.hookEvents(this.grid);
    }
    ngOnDestroy() {
        this.unhookEvents(this._grid);
        this._sub?.unsubscribe();
        this._grid?.destroy();
        delete this._grid;
        delete this.el._gridComp;
        delete this.container;
        delete this.ref;
    }
    /**
     * called when the TEMPLATE (not recommended) list of items changes - get a list of nodes and
     * update the layout accordingly (which will take care of adding/removing items changed by Angular)
     */
    updateAll() {
        if (!this.grid)
            return;
        const layout = [];
        this.gridstackItems?.forEach(item => {
            layout.push(item.options);
            item.clearOptions();
        });
        this.grid.load(layout); // efficient that does diffs only
    }
    /** check if the grid is empty, if so show alternative content */
    checkEmpty() {
        if (!this.grid)
            return;
        this.isEmpty = !this.grid.engine.nodes.length;
    }
    /** get all known events as easy to use Outputs for convenience */
    hookEvents(grid) {
        if (!grid)
            return;
        // nested grids don't have events in v12.1+ so skip
        if (grid.parentGridNode)
            return;
        grid
            .on('added', (event, nodes) => {
            const gridComp = nodes[0].grid?.el._gridComp || this;
            gridComp.checkEmpty();
            this.addedCB.emit({ event, nodes });
        })
            .on('change', (event, nodes) => this.changeCB.emit({ event, nodes }))
            .on('disable', (event) => this.disableCB.emit({ event }))
            .on('drag', (event, el) => this.dragCB.emit({ event, el }))
            .on('dragstart', (event, el) => this.dragStartCB.emit({ event, el }))
            .on('dragstop', (event, el) => this.dragStopCB.emit({ event, el }))
            .on('dropped', (event, previousNode, newNode) => this.droppedCB.emit({ event, previousNode, newNode }))
            .on('enable', (event) => this.enableCB.emit({ event }))
            .on('removed', (event, nodes) => {
            const gridComp = nodes[0].grid?.el._gridComp || this;
            gridComp.checkEmpty();
            this.removedCB.emit({ event, nodes });
        })
            .on('resize', (event, el) => this.resizeCB.emit({ event, el }))
            .on('resizestart', (event, el) => this.resizeStartCB.emit({ event, el }))
            .on('resizestop', (event, el) => this.resizeStopCB.emit({ event, el }));
    }
    unhookEvents(grid) {
        if (!grid)
            return;
        // nested grids don't have events in v12.1+ so skip
        if (grid.parentGridNode)
            return;
        grid.off('added change disable drag dragstart dragstop dropped enable removed resize resizestart resizestop');
    }
}
/**
 * stores the selector -> Type mapping, so we can create items dynamically from a string.
 * Unfortunately Ng doesn't provide public access to that mapping.
 */
GridstackComponent.selectorToType = {};
GridstackComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: GridstackComponent, deps: [{ token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Component });
GridstackComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.3.0", type: GridstackComponent, isStandalone: true, selector: "gridstack", inputs: { options: "options", isEmpty: "isEmpty" }, outputs: { addedCB: "addedCB", changeCB: "changeCB", disableCB: "disableCB", dragCB: "dragCB", dragStartCB: "dragStartCB", dragStopCB: "dragStopCB", droppedCB: "droppedCB", enableCB: "enableCB", removedCB: "removedCB", resizeCB: "resizeCB", resizeStartCB: "resizeStartCB", resizeStopCB: "resizeStopCB" }, queries: [{ propertyName: "gridstackItems", predicate: GridstackItemComponent }], viewQueries: [{ propertyName: "container", first: true, predicate: ["container"], descendants: true, read: ViewContainerRef, static: true }], ngImport: i0, template: `
    <!-- content to show when when grid is empty, like instructions on how to add widgets -->
    <ng-content select="[empty-content]" *ngIf="isEmpty"></ng-content>
    <!-- where dynamic items go -->
    <ng-template #container></ng-template>
    <!-- where template items go -->
    <ng-content></ng-content>
  `, isInline: true, styles: [":host{display:block}\n"], dependencies: [{ kind: "directive", type: NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: GridstackComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridstack', template: `
    <!-- content to show when when grid is empty, like instructions on how to add widgets -->
    <ng-content select="[empty-content]" *ngIf="isEmpty"></ng-content>
    <!-- where dynamic items go -->
    <ng-template #container></ng-template>
    <!-- where template items go -->
    <ng-content></ng-content>
  `, standalone: true, imports: [NgIf], styles: [":host{display:block}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }]; }, propDecorators: { gridstackItems: [{
                type: ContentChildren,
                args: [GridstackItemComponent]
            }], container: [{
                type: ViewChild,
                args: ['container', { read: ViewContainerRef, static: true }]
            }], options: [{
                type: Input
            }], isEmpty: [{
                type: Input
            }], addedCB: [{
                type: Output
            }], changeCB: [{
                type: Output
            }], disableCB: [{
                type: Output
            }], dragCB: [{
                type: Output
            }], dragStartCB: [{
                type: Output
            }], dragStopCB: [{
                type: Output
            }], droppedCB: [{
                type: Output
            }], enableCB: [{
                type: Output
            }], removedCB: [{
                type: Output
            }], resizeCB: [{
                type: Output
            }], resizeStartCB: [{
                type: Output
            }], resizeStopCB: [{
                type: Output
            }] } });
/**
 * can be used when a new item needs to be created, which we do as a Angular component, or deleted (skip)
 **/
export function gsCreateNgComponents(host, n, add, isGrid) {
    if (add) {
        //
        // create the component dynamically - see https://angular.io/docs/ts/latest/cookbook/dynamic-component-loader.html
        //
        if (!host)
            return;
        if (isGrid) {
            // TODO: figure out how to create ng component inside regular Div. need to access app injectors...
            // if (!container) {
            //   const hostElement: Element = host;
            //   const environmentInjector: EnvironmentInjector;
            //   grid = createComponent(GridstackComponent, {environmentInjector, hostElement})?.instance;
            // }
            const gridItemComp = host.parentElement?._gridItemComp;
            if (!gridItemComp)
                return;
            // check if gridItem has a child component with 'container' exposed to create under..
            const container = gridItemComp.childWidget?.container || gridItemComp.container;
            const gridRef = container?.createComponent(GridstackComponent);
            const grid = gridRef?.instance;
            if (!grid)
                return;
            grid.ref = gridRef;
            grid.options = n;
            return grid.el;
        }
        else {
            const gridComp = host._gridComp;
            const gridItemRef = gridComp?.container?.createComponent(GridstackItemComponent);
            const gridItem = gridItemRef?.instance;
            if (!gridItem)
                return;
            gridItem.ref = gridItemRef;
            // define what type of component to create as child, OR you can do it GridstackItemComponent template, but this is more generic
            const selector = n.selector;
            const type = selector ? GridstackComponent.selectorToType[selector] : undefined;
            if (type) {
                // shared code to create our selector component
                const createComp = () => {
                    const childWidget = gridItem.container?.createComponent(type)?.instance;
                    // if proper BaseWidget subclass, save it and load additional data
                    if (childWidget && typeof childWidget.serialize === 'function' && typeof childWidget.deserialize === 'function') {
                        gridItem.childWidget = childWidget;
                        childWidget.deserialize(n);
                    }
                };
                const lazyLoad = n.lazyLoad || n.grid?.opts?.lazyLoad && n.lazyLoad !== false;
                if (lazyLoad) {
                    if (!n.visibleObservable) {
                        n.visibleObservable = new IntersectionObserver(([entry]) => {
                            if (entry.isIntersecting) {
                                n.visibleObservable?.disconnect();
                                delete n.visibleObservable;
                                createComp();
                            }
                        });
                        window.setTimeout(() => n.visibleObservable?.observe(gridItem.el)); // wait until callee sets position attributes
                    }
                }
                else
                    createComp();
            }
            return gridItem.el;
        }
    }
    else {
        //
        // REMOVE - have to call ComponentRef:destroy() for dynamic objects to correctly remove themselves
        // Note: this will destroy all children dynamic components as well: gridItem -> childWidget
        //
        if (isGrid) {
            const grid = n.el?._gridComp;
            if (grid?.ref)
                grid.ref.destroy();
            else
                grid?.ngOnDestroy();
        }
        else {
            const gridItem = n.el?._gridItemComp;
            if (gridItem?.ref)
                gridItem.ref.destroy();
            else
                gridItem?.ngOnDestroy();
        }
    }
    return;
}
/**
 * called for each item in the grid - check if additional information needs to be saved.
 * Note: since this is options minus gridstack protected members using Utils.removeInternalForSave(),
 * this typically doesn't need to do anything. However your custom Component @Input() are now supported
 * using BaseWidget.serialize()
 */
export function gsSaveAdditionalNgInfo(n, w) {
    const gridItem = n.el?._gridItemComp;
    if (gridItem) {
        const input = gridItem.childWidget?.serialize();
        if (input) {
            w.input = input;
        }
        return;
    }
    // else check if Grid
    const grid = n.el?._gridComp;
    if (grid) {
        //.... save any custom data
    }
}
/**
 * track when widgeta re updated (rather than created) to make sure we de-serialize them as well
 */
export function gsUpdateNgComponents(n) {
    const w = n;
    const gridItem = n.el?._gridItemComp;
    if (gridItem?.childWidget && w.input)
        gridItem.childWidget.deserialize(w);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0YWNrLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2FuZ3VsYXIvcHJvamVjdHMvbGliL3NyYy9saWIvZ3JpZHN0YWNrLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0dBR0c7QUFFSCxPQUFPLEVBQ2UsU0FBUyxFQUFFLGVBQWUsRUFBYyxZQUFZLEVBQUUsS0FBSyxFQUMxRCxNQUFNLEVBQW1CLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFDaEcsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRXZDLE9BQU8sRUFBd0MsU0FBUyxFQUFvRCxNQUFNLFdBQVcsQ0FBQztBQUk5SCxPQUFPLEVBQTJCLHNCQUFzQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7O0FBZ0I3Rjs7R0FFRztBQWtCSCxNQUFNLE9BQU8sa0JBQWtCO0lBcUU3QixZQUErQixVQUEyQztRQUEzQyxlQUFVLEdBQVYsVUFBVSxDQUFpQztRQWhEMUU7Ozs7OztXQU1HO1FBQ2MsWUFBTyxHQUFHLElBQUksWUFBWSxFQUFXLENBQUM7UUFDdEMsYUFBUSxHQUFHLElBQUksWUFBWSxFQUFXLENBQUM7UUFDdkMsY0FBUyxHQUFHLElBQUksWUFBWSxFQUFXLENBQUM7UUFDeEMsV0FBTSxHQUFHLElBQUksWUFBWSxFQUFhLENBQUM7UUFDdkMsZ0JBQVcsR0FBRyxJQUFJLFlBQVksRUFBYSxDQUFDO1FBQzVDLGVBQVUsR0FBRyxJQUFJLFlBQVksRUFBYSxDQUFDO1FBQzNDLGNBQVMsR0FBRyxJQUFJLFlBQVksRUFBYSxDQUFDO1FBQzFDLGFBQVEsR0FBRyxJQUFJLFlBQVksRUFBVyxDQUFDO1FBQ3ZDLGNBQVMsR0FBRyxJQUFJLFlBQVksRUFBVyxDQUFDO1FBQ3hDLGFBQVEsR0FBRyxJQUFJLFlBQVksRUFBYSxDQUFDO1FBQ3pDLGtCQUFhLEdBQUcs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UUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBncmlkc3RhY2suY29tcG9uZW50LnRzIDEyLjIuMlxuICogQ29weXJpZ2h0IChjKSAyMDIyLTIwMjQgQWxhaW4gRHVtZXNueSAtIHNlZSBHcmlkU3RhY2sgcm9vdCBsaWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgICBBZnRlckNvbnRlbnRJbml0LCBDb21wb25lbnQsIENvbnRlbnRDaGlsZHJlbiwgRWxlbWVudFJlZiwgRXZlbnRFbWl0dGVyLCBJbnB1dCxcbiAgICBPbkRlc3Ryb3ksIE9uSW5pdCwgT3V0cHV0LCBRdWVyeUxpc3QsIFR5cGUsIFZpZXdDaGlsZCwgVmlld0NvbnRhaW5lclJlZiwgcmVmbGVjdENvbXBvbmVudFR5cGUsIENvbXBvbmVudFJlZlxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE5nSWYgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBHcmlkSFRNTEVsZW1lbnQsIEdyaWRJdGVtSFRNTEVsZW1lbnQsIEdyaWRTdGFjaywgR3JpZFN0YWNrTm9kZSwgR3JpZFN0YWNrT3B0aW9ucywgR3JpZFN0YWNrV2lkZ2V0IH0gZnJvbSAnZ3JpZHN0YWNrJztcblxuaW1wb3J0IHsgTmdHcmlkU3RhY2tOb2RlLCBOZ0dyaWRTdGFja1dpZGdldCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQmFzZVdpZGdldCB9IGZyb20gJy4vYmFzZS13aWRnZXQnO1xuaW1wb3J0IHsgR3JpZEl0ZW1Db21wSFRNTEVsZW1lbnQsIEdyaWRzdGFja0l0ZW1Db21wb25lbnQgfSBmcm9tICcuL2dyaWRzdGFjay1pdGVtLmNvbXBvbmVudCc7XG5cbi8qKiBldmVudHMgaGFuZGxlcnMgZW1pdHRlcnMgc2lnbmF0dXJlIGZvciBkaWZmZXJlbnQgZXZlbnRzICovXG5leHBvcnQgdHlwZSBldmVudENCID0ge2V2ZW50OiBFdmVudH07XG5leHBvcnQgdHlwZSBlbGVtZW50Q0IgPSB7ZXZlbnQ6IEV2ZW50LCBlbDogR3JpZEl0ZW1IVE1MRWxlbWVudH07XG5leHBvcnQgdHlwZSBub2Rlc0NCID0ge2V2ZW50OiBFdmVudCwgbm9kZXM6IEdyaWRTdGFja05vZGVbXX07XG5leHBvcnQgdHlwZSBkcm9wcGVkQ0IgPSB7ZXZlbnQ6IEV2ZW50LCBwcmV2aW91c05vZGU6IEdyaWRTdGFja05vZGUsIG5ld05vZGU6IEdyaWRTdGFja05vZGV9O1xuXG4vKiogc3RvcmUgZWxlbWVudCB0byBOZyBDbGFzcyBwb2ludGVyIGJhY2sgKi9cbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENvbXBIVE1MRWxlbWVudCBleHRlbmRzIEdyaWRIVE1MRWxlbWVudCB7XG4gIF9ncmlkQ29tcD86IEdyaWRzdGFja0NvbXBvbmVudDtcbn1cblxuLyoqIHNlbGVjdG9yIHN0cmluZyB0byBydW50aW1lIFR5cGUgbWFwcGluZyAqL1xuZXhwb3J0IHR5cGUgU2VsZWN0b3JUb1R5cGUgPSB7W2tleTogc3RyaW5nXTogVHlwZTxPYmplY3Q+fTtcblxuLyoqXG4gKiBIVE1MIENvbXBvbmVudCBXcmFwcGVyIGZvciBncmlkc3RhY2ssIGluIGNvbWJpbmF0aW9uIHdpdGggR3JpZHN0YWNrSXRlbUNvbXBvbmVudCBmb3IgdGhlIGl0ZW1zXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2dyaWRzdGFjaycsXG4gIHRlbXBsYXRlOiBgXG4gICAgPCEtLSBjb250ZW50IHRvIHNob3cgd2hlbiB3aGVuIGdyaWQgaXMgZW1wdHksIGxpa2UgaW5zdHJ1Y3Rpb25zIG9uIGhvdyB0byBhZGQgd2lkZ2V0cyAtLT5cbiAgICA8bmctY29udGVudCBzZWxlY3Q9XCJbZW1wdHktY29udGVudF1cIiAqbmdJZj1cImlzRW1wdHlcIj48L25nLWNvbnRlbnQ+XG4gICAgPCEtLSB3aGVyZSBkeW5hbWljIGl0ZW1zIGdvIC0tPlxuICAgIDxuZy10ZW1wbGF0ZSAjY29udGFpbmVyPjwvbmctdGVtcGxhdGU+XG4gICAgPCEtLSB3aGVyZSB0ZW1wbGF0ZSBpdGVtcyBnbyAtLT5cbiAgICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG4gIGAsXG4gIHN0eWxlczogW2BcbiAgICA6aG9zdCB7IGRpc3BsYXk6IGJsb2NrOyB9XG4gIGBdLFxuICBzdGFuZGFsb25lOiB0cnVlLFxuICBpbXBvcnRzOiBbTmdJZl1cbiAgLy8gY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsIC8vIElGRiB5b3Ugd2FudCB0byBvcHRpbWl6ZSBhbmQgY29udHJvbCB3aGVuIENoYW5nZURldGVjdGlvbiBuZWVkcyB0byBoYXBwZW4uLi5cbn0pXG5leHBvcnQgY2xhc3MgR3JpZHN0YWNrQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xuXG4gIC8qKiB0cmFjayBsaXN0IG9mIFRFTVBMQVRFIChub3QgcmVjb21tZW5kZWQpIGdyaWQgaXRlbXMgc28gd2UgY2FuIHN5bmMgYmV0d2VlbiBET00gYW5kIEdTIGludGVybmFscyAqL1xuICBAQ29udGVudENoaWxkcmVuKEdyaWRzdGFja0l0ZW1Db21wb25lbnQpIHB1YmxpYyBncmlkc3RhY2tJdGVtcz86IFF1ZXJ5TGlzdDxHcmlkc3RhY2tJdGVtQ29tcG9uZW50PjtcbiAgLyoqIGNvbnRhaW5lciB0byBhcHBlbmQgaXRlbXMgZHluYW1pY2FsbHkgKHJlY29tbWVuZGVkIHdheSkgKi9cbiAgQFZpZXdDaGlsZCgnY29udGFpbmVyJywgeyByZWFkOiBWaWV3Q29udGFpbmVyUmVmLCBzdGF0aWM6IHRydWV9KSBwdWJsaWMgY29udGFpbmVyPzogVmlld0NvbnRhaW5lclJlZjtcblxuICAvKiogaW5pdGlhbCBvcHRpb25zIGZvciBjcmVhdGlvbiBvZiB0aGUgZ3JpZCAqL1xuICBASW5wdXQoKSBwdWJsaWMgc2V0IG9wdGlvbnMobzogR3JpZFN0YWNrT3B0aW9ucykge1xuICAgIGlmICh0aGlzLl9ncmlkKSB7XG4gICAgICB0aGlzLl9ncmlkLnVwZGF0ZU9wdGlvbnMobyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX29wdGlvbnMgPSBvO1xuICAgIH1cbiAgfVxuICAvKiogcmV0dXJuIHRoZSBjdXJyZW50IHJ1bm5pbmcgb3B0aW9ucyAqL1xuICBwdWJsaWMgZ2V0IG9wdGlvbnMoKTogR3JpZFN0YWNrT3B0aW9ucyB7IHJldHVybiB0aGlzLl9ncmlkPy5vcHRzIHx8IHRoaXMuX29wdGlvbnMgfHwge307IH1cblxuICAvKiogdHJ1ZSB3aGlsZSBuZy1jb250ZW50IHdpdGggJ25vLWl0ZW0tY29udGVudCcgc2hvdWxkIGJlIHNob3duIHdoZW4gbGFzdCBpdGVtIGlzIHJlbW92ZWQgZnJvbSBhIGdyaWQgKi9cbiAgQElucHV0KCkgcHVibGljIGlzRW1wdHk/OiBib29sZWFuO1xuXG4gIC8qKiBpbmRpdmlkdWFsIGxpc3Qgb2YgR3JpZFN0YWNrRXZlbnQgY2FsbGJhY2tzIGhhbmRsZXJzIGFzIG91dHB1dFxuICAgKiBvdGhlcndpc2UgdXNlIHRoaXMuZ3JpZC5vbignbmFtZTEgbmFtZTIgbmFtZTMnLCBjYWxsYmFjaykgdG8gaGFuZGxlIG11bHRpcGxlIGF0IG9uY2VcbiAgICogc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9ncmlkc3RhY2svZ3JpZHN0YWNrLmpzL2Jsb2IvbWFzdGVyL2RlbW8vZXZlbnRzLmpzI0w0XG4gICAqXG4gICAqIE5vdGU6IGNhbWVsIGNhc2luZyBhbmQgJ0NCJyBhZGRlZCBhdCB0aGUgZW5kIHRvIHByZXZlbnQgQGFuZ3VsYXItZXNsaW50L25vLW91dHB1dC1uYXRpdmVcbiAgICogZWc6ICdjaGFuZ2UnIHdvdWxkIHRyaWdnZXIgdGhlIHJhdyBDdXN0b21FdmVudCBzbyB1c2UgZGlmZmVyZW50IG5hbWUuXG4gICAqL1xuICBAT3V0cHV0KCkgcHVibGljIGFkZGVkQ0IgPSBuZXcgRXZlbnRFbWl0dGVyPG5vZGVzQ0I+KCk7XG4gIEBPdXRwdXQoKSBwdWJsaWMgY2hhbmdlQ0IgPSBuZXcgRXZlbnRFbWl0dGVyPG5vZGVzQ0I+KCk7XG4gIEBPdXRwdXQoKSBwdWJsaWMgZGlzYWJsZUNCID0gbmV3IEV2ZW50RW1pdHRlcjxldmVudENCPigpO1xuICBAT3V0cHV0KCkgcHVibGljIGRyYWdDQiA9IG5ldyBFdmVudEVtaXR0ZXI8ZWxlbWVudENCPigpO1xuICBAT3V0cHV0KCkgcHVibGljIGRyYWdTdGFydENCID0gbmV3IEV2ZW50RW1pdHRlcjxlbGVtZW50Q0I+KCk7XG4gIEBPdXRwdXQoKSBwdWJsaWMgZHJhZ1N0b3BDQiA9IG5ldyBFdmVudEVtaXR0ZXI8ZWxlbWVudENCPigpO1xuICBAT3V0cHV0KCkgcHVibGljIGRyb3BwZWRDQiA9IG5ldyBFdmVudEVtaXR0ZXI8ZHJvcHBlZENCPigpO1xuICBAT3V0cHV0KCkgcHVibGljIGVuYWJsZUNCID0gbmV3IEV2ZW50RW1pdHRlcjxldmVudENCPigpO1xuICBAT3V0cHV0KCkgcHVibGljIHJlbW92ZWRDQiA9IG5ldyBFdmVudEVtaXR0ZXI8bm9kZXNDQj4oKTtcbiAgQE91dHB1dCgpIHB1YmxpYyByZXNpemVDQiA9IG5ldyBFdmVudEVtaXR0ZXI8ZWxlbWVudENCPigpO1xuICBAT3V0cHV0KCkgcHVibGljIHJlc2l6ZVN0YXJ0Q0IgPSBuZXcgRXZlbnRFbWl0dGVyPGVsZW1lbnRDQj4oKTtcbiAgQE91dHB1dCgpIHB1YmxpYyByZXNpemVTdG9wQ0IgPSBuZXcgRXZlbnRFbWl0dGVyPGVsZW1lbnRDQj4oKTtcblxuICAvKiogcmV0dXJuIHRoZSBuYXRpdmUgZWxlbWVudCB0aGF0IGNvbnRhaW5zIGdyaWQgc3BlY2lmaWMgZmllbGRzIGFzIHdlbGwgKi9cbiAgcHVibGljIGdldCBlbCgpOiBHcmlkQ29tcEhUTUxFbGVtZW50IHsgcmV0dXJuIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50OyB9XG5cbiAgLyoqIHJldHVybiB0aGUgR3JpZFN0YWNrIGNsYXNzICovXG4gIHB1YmxpYyBnZXQgZ3JpZCgpOiBHcmlkU3RhY2sgfCB1bmRlZmluZWQgeyByZXR1cm4gdGhpcy5fZ3JpZDsgfVxuXG4gIC8qKiBDb21wb25lbnRSZWYgb2Ygb3Vyc2VsZiAtIHVzZWQgYnkgZHluYW1pYyBvYmplY3QgdG8gY29ycmVjdGx5IGdldCByZW1vdmVkICovXG4gIHB1YmxpYyByZWY6IENvbXBvbmVudFJlZjxHcmlkc3RhY2tDb21wb25lbnQ+IHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBzdG9yZXMgdGhlIHNlbGVjdG9yIC0+IFR5cGUgbWFwcGluZywgc28gd2UgY2FuIGNyZWF0ZSBpdGVtcyBkeW5hbWljYWxseSBmcm9tIGEgc3RyaW5nLlxuICAgKiBVbmZvcnR1bmF0ZWx5IE5nIGRvZXNuJ3QgcHJvdmlkZSBwdWJsaWMgYWNjZXNzIHRvIHRoYXQgbWFwcGluZy5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgc2VsZWN0b3JUb1R5cGU6IFNlbGVjdG9yVG9UeXBlID0ge307XG4gIC8qKiBhZGQgYSBsaXN0IG9mIG5nIENvbXBvbmVudCB0byBiZSBtYXBwZWQgdG8gc2VsZWN0b3IgKi9cbiAgcHVibGljIHN0YXRpYyBhZGRDb21wb25lbnRUb1NlbGVjdG9yVHlwZSh0eXBlTGlzdDogQXJyYXk8VHlwZTxPYmplY3Q+Pikge1xuICAgIHR5cGVMaXN0LmZvckVhY2godHlwZSA9PiBHcmlkc3RhY2tDb21wb25lbnQuc2VsZWN0b3JUb1R5cGVbIEdyaWRzdGFja0NvbXBvbmVudC5nZXRTZWxlY3Rvcih0eXBlKSBdID0gdHlwZSk7XG4gIH1cbiAgLyoqIHJldHVybiB0aGUgbmcgQ29tcG9uZW50IHNlbGVjdG9yICovXG4gIHB1YmxpYyBzdGF0aWMgZ2V0U2VsZWN0b3IodHlwZTogVHlwZTxPYmplY3Q+KTogc3RyaW5nIHtcbiAgICByZXR1cm4gcmVmbGVjdENvbXBvbmVudFR5cGUodHlwZSkhLnNlbGVjdG9yO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9vcHRpb25zPzogR3JpZFN0YWNrT3B0aW9ucztcbiAgcHJvdGVjdGVkIF9ncmlkPzogR3JpZFN0YWNrO1xuICBwcm90ZWN0ZWQgX3N1YjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkO1xuICBwcm90ZWN0ZWQgbG9hZGVkPzogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgcmVhZG9ubHkgZWxlbWVudFJlZjogRWxlbWVudFJlZjxHcmlkQ29tcEhUTUxFbGVtZW50Pikge1xuICAgIC8vIHNldCBnbG9iYWxseSBvdXIgbWV0aG9kIHRvIGNyZWF0ZSB0aGUgcmlnaHQgd2lkZ2V0IHR5cGVcbiAgICBpZiAoIUdyaWRTdGFjay5hZGRSZW1vdmVDQikge1xuICAgICAgR3JpZFN0YWNrLmFkZFJlbW92ZUNCID0gZ3NDcmVhdGVOZ0NvbXBvbmVudHM7XG4gICAgfVxuICAgIGlmICghR3JpZFN0YWNrLnNhdmVDQikge1xuICAgICAgR3JpZFN0YWNrLnNhdmVDQiA9IGdzU2F2ZUFkZGl0aW9uYWxOZ0luZm87XG4gICAgfVxuICAgIGlmICghR3JpZFN0YWNrLnVwZGF0ZUNCKSB7XG4gICAgICBHcmlkU3RhY2sudXBkYXRlQ0IgPSBnc1VwZGF0ZU5nQ29tcG9uZW50cztcbiAgICB9XG4gICAgdGhpcy5lbC5fZ3JpZENvbXAgPSB0aGlzO1xuICB9XG5cbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIC8vIGluaXQgb3Vyc2VsZiBiZWZvcmUgYW55IHRlbXBsYXRlIGNoaWxkcmVuIGFyZSBjcmVhdGVkIHNpbmNlIHdlIHRyYWNrIHRoZW0gYmVsb3cgYW55d2F5IC0gbm8gbmVlZCB0byBkb3VibGUgY3JlYXRlK3VwZGF0ZSB3aWRnZXRzXG4gICAgdGhpcy5sb2FkZWQgPSAhIXRoaXMub3B0aW9ucz8uY2hpbGRyZW4/Lmxlbmd0aDtcbiAgICB0aGlzLl9ncmlkID0gR3JpZFN0YWNrLmluaXQodGhpcy5fb3B0aW9ucywgdGhpcy5lbCk7XG4gICAgZGVsZXRlIHRoaXMuX29wdGlvbnM7IC8vIEdTIGhhcyBpdCBub3dcblxuICAgIHRoaXMuY2hlY2tFbXB0eSgpO1xuICB9XG5cbiAgLyoqIHdhaXQgdW50aWwgYWZ0ZXIgYWxsIERPTSBpcyByZWFkeSB0byBpbml0IGdyaWRzdGFjayBjaGlsZHJlbiAoYWZ0ZXIgYW5ndWxhciBuZ0ZvciBhbmQgc3ViLWNvbXBvbmVudHMgcnVuIGZpcnN0KSAqL1xuICBwdWJsaWMgbmdBZnRlckNvbnRlbnRJbml0KCk6IHZvaWQge1xuICAgIC8vIHRyYWNrIHdoZW5ldmVyIHRoZSBjaGlsZHJlbiBsaXN0IGNoYW5nZXMgYW5kIHVwZGF0ZSB0aGUgbGF5b3V0Li4uXG4gICAgdGhpcy5fc3ViID0gdGhpcy5ncmlkc3RhY2tJdGVtcz8uY2hhbmdlcy5zdWJzY3JpYmUoKCkgPT4gdGhpcy51cGRhdGVBbGwoKSk7XG4gICAgLy8gLi4uYW5kIGRvIHRoaXMgb25jZSBhdCBsZWFzdCB1bmxlc3Mgd2UgbG9hZGVkIGNoaWxkcmVuIGFscmVhZHlcbiAgICBpZiAoIXRoaXMubG9hZGVkKSB0aGlzLnVwZGF0ZUFsbCgpO1xuICAgIHRoaXMuaG9va0V2ZW50cyh0aGlzLmdyaWQpO1xuICB9XG5cbiAgcHVibGljIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMudW5ob29rRXZlbnRzKHRoaXMuX2dyaWQpO1xuICAgIHRoaXMuX3N1Yj8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9ncmlkPy5kZXN0cm95KCk7XG4gICAgZGVsZXRlIHRoaXMuX2dyaWQ7XG4gICAgZGVsZXRlIHRoaXMuZWwuX2dyaWRDb21wO1xuICAgIGRlbGV0ZSB0aGlzLmNvbnRhaW5lcjtcbiAgICBkZWxldGUgdGhpcy5yZWY7XG4gIH1cblxuICAvKipcbiAgICogY2FsbGVkIHdoZW4gdGhlIFRFTVBMQVRFIChub3QgcmVjb21tZW5kZWQpIGxpc3Qgb2YgaXRlbXMgY2hhbmdlcyAtIGdldCBhIGxpc3Qgb2Ygbm9kZXMgYW5kXG4gICAqIHVwZGF0ZSB0aGUgbGF5b3V0IGFjY29yZGluZ2x5ICh3aGljaCB3aWxsIHRha2UgY2FyZSBvZiBhZGRpbmcvcmVtb3ZpbmcgaXRlbXMgY2hhbmdlZCBieSBBbmd1bGFyKVxuICAgKi9cbiAgcHVibGljIHVwZGF0ZUFsbCgpIHtcbiAgICBpZiAoIXRoaXMuZ3JpZCkgcmV0dXJuO1xuICAgIGNvbnN0IGxheW91dDogR3JpZFN0YWNrV2lkZ2V0W10gPSBbXTtcbiAgICB0aGlzLmdyaWRzdGFja0l0ZW1zPy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgbGF5b3V0LnB1c2goaXRlbS5vcHRpb25zKTtcbiAgICAgIGl0ZW0uY2xlYXJPcHRpb25zKCk7XG4gICAgfSk7XG4gICAgdGhpcy5ncmlkLmxvYWQobGF5b3V0KTsgLy8gZWZmaWNpZW50IHRoYXQgZG9lcyBkaWZmcyBvbmx5XG4gIH1cblxuICAvKiogY2hlY2sgaWYgdGhlIGdyaWQgaXMgZW1wdHksIGlmIHNvIHNob3cgYWx0ZXJuYXRpdmUgY29udGVudCAqL1xuICBwdWJsaWMgY2hlY2tFbXB0eSgpIHtcbiAgICBpZiAoIXRoaXMuZ3JpZCkgcmV0dXJuO1xuICAgIHRoaXMuaXNFbXB0eSA9ICF0aGlzLmdyaWQuZW5naW5lLm5vZGVzLmxlbmd0aDtcbiAgfVxuXG4gIC8qKiBnZXQgYWxsIGtub3duIGV2ZW50cyBhcyBlYXN5IHRvIHVzZSBPdXRwdXRzIGZvciBjb252ZW5pZW5jZSAqL1xuICBwcm90ZWN0ZWQgaG9va0V2ZW50cyhncmlkPzogR3JpZFN0YWNrKSB7XG4gICAgaWYgKCFncmlkKSByZXR1cm47XG4gICAgLy8gbmVzdGVkIGdyaWRzIGRvbid0IGhhdmUgZXZlbnRzIGluIHYxMi4xKyBzbyBza2lwXG4gICAgaWYgKGdyaWQucGFyZW50R3JpZE5vZGUpIHJldHVybjtcbiAgICBncmlkXG4gICAgICAub24oJ2FkZGVkJywgKGV2ZW50OiBFdmVudCwgbm9kZXM6IEdyaWRTdGFja05vZGVbXSkgPT4ge1xuICAgICAgICBjb25zdCBncmlkQ29tcCA9IChub2Rlc1swXS5ncmlkPy5lbCBhcyBHcmlkQ29tcEhUTUxFbGVtZW50KS5fZ3JpZENvbXAgfHwgdGhpcztcbiAgICAgICAgZ3JpZENvbXAuY2hlY2tFbXB0eSgpO1xuICAgICAgICB0aGlzLmFkZGVkQ0IuZW1pdCh7ZXZlbnQsIG5vZGVzfSk7XG4gICAgICB9KVxuICAgICAgLm9uKCdjaGFuZ2UnLCAoZXZlbnQ6IEV2ZW50LCBub2RlczogR3JpZFN0YWNrTm9kZVtdKSA9PiB0aGlzLmNoYW5nZUNCLmVtaXQoe2V2ZW50LCBub2Rlc30pKVxuICAgICAgLm9uKCdkaXNhYmxlJywgKGV2ZW50OiBFdmVudCkgPT4gdGhpcy5kaXNhYmxlQ0IuZW1pdCh7ZXZlbnR9KSlcbiAgICAgIC5vbignZHJhZycsIChldmVudDogRXZlbnQsIGVsOiBHcmlkSXRlbUhUTUxFbGVtZW50KSA9PiB0aGlzLmRyYWdDQi5lbWl0KHtldmVudCwgZWx9KSlcbiAgICAgIC5vbignZHJhZ3N0YXJ0JywgKGV2ZW50OiBFdmVudCwgZWw6IEdyaWRJdGVtSFRNTEVsZW1lbnQpID0+IHRoaXMuZHJhZ1N0YXJ0Q0IuZW1pdCh7ZXZlbnQsIGVsfSkpXG4gICAgICAub24oJ2RyYWdzdG9wJywgKGV2ZW50OiBFdmVudCwgZWw6IEdyaWRJdGVtSFRNTEVsZW1lbnQpID0+IHRoaXMuZHJhZ1N0b3BDQi5lbWl0KHtldmVudCwgZWx9KSlcbiAgICAgIC5vbignZHJvcHBlZCcsIChldmVudDogRXZlbnQsIHByZXZpb3VzTm9kZTogR3JpZFN0YWNrTm9kZSwgbmV3Tm9kZTogR3JpZFN0YWNrTm9kZSkgPT4gdGhpcy5kcm9wcGVkQ0IuZW1pdCh7ZXZlbnQsIHByZXZpb3VzTm9kZSwgbmV3Tm9kZX0pKVxuICAgICAgLm9uKCdlbmFibGUnLCAoZXZlbnQ6IEV2ZW50KSA9PiB0aGlzLmVuYWJsZUNCLmVtaXQoe2V2ZW50fSkpXG4gICAgICAub24oJ3JlbW92ZWQnLCAoZXZlbnQ6IEV2ZW50LCBub2RlczogR3JpZFN0YWNrTm9kZVtdKSA9PiB7XG4gICAgICAgIGNvbnN0IGdyaWRDb21wID0gKG5vZGVzWzBdLmdyaWQ/LmVsIGFzIEdyaWRDb21wSFRNTEVsZW1lbnQpLl9ncmlkQ29tcCB8fCB0aGlzO1xuICAgICAgICBncmlkQ29tcC5jaGVja0VtcHR5KCk7XG4gICAgICAgIHRoaXMucmVtb3ZlZENCLmVtaXQoe2V2ZW50LCBub2Rlc30pO1xuICAgICAgfSlcbiAgICAgIC5vbigncmVzaXplJywgKGV2ZW50OiBFdmVudCwgZWw6IEdyaWRJdGVtSFRNTEVsZW1lbnQpID0+IHRoaXMucmVzaXplQ0IuZW1pdCh7ZXZlbnQsIGVsfSkpXG4gICAgICAub24oJ3Jlc2l6ZXN0YXJ0JywgKGV2ZW50OiBFdmVudCwgZWw6IEdyaWRJdGVtSFRNTEVsZW1lbnQpID0+IHRoaXMucmVzaXplU3RhcnRDQi5lbWl0KHtldmVudCwgZWx9KSlcbiAgICAgIC5vbigncmVzaXplc3RvcCcsIChldmVudDogRXZlbnQsIGVsOiBHcmlkSXRlbUhUTUxFbGVtZW50KSA9PiB0aGlzLnJlc2l6ZVN0b3BDQi5lbWl0KHtldmVudCwgZWx9KSlcbiAgfVxuXG4gIHByb3RlY3RlZCB1bmhvb2tFdmVudHMoZ3JpZD86IEdyaWRTdGFjaykge1xuICAgIGlmICghZ3JpZCkgcmV0dXJuO1xuICAgIC8vIG5lc3RlZCBncmlkcyBkb24ndCBoYXZlIGV2ZW50cyBpbiB2MTIuMSsgc28gc2tpcFxuICAgIGlmIChncmlkLnBhcmVudEdyaWROb2RlKSByZXR1cm47XG4gICAgZ3JpZC5vZmYoJ2FkZGVkIGNoYW5nZSBkaXNhYmxlIGRyYWcgZHJhZ3N0YXJ0IGRyYWdzdG9wIGRyb3BwZWQgZW5hYmxlIHJlbW92ZWQgcmVzaXplIHJlc2l6ZXN0YXJ0IHJlc2l6ZXN0b3AnKTtcbiAgfVxufVxuXG4vKipcbiAqIGNhbiBiZSB1c2VkIHdoZW4gYSBuZXcgaXRlbSBuZWVkcyB0byBiZSBjcmVhdGVkLCB3aGljaCB3ZSBkbyBhcyBhIEFuZ3VsYXIgY29tcG9uZW50LCBvciBkZWxldGVkIChza2lwKVxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIGdzQ3JlYXRlTmdDb21wb25lbnRzKGhvc3Q6IEdyaWRDb21wSFRNTEVsZW1lbnQgfCBIVE1MRWxlbWVudCwgbjogTmdHcmlkU3RhY2tOb2RlLCBhZGQ6IGJvb2xlYW4sIGlzR3JpZDogYm9vbGVhbik6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgaWYgKGFkZCkge1xuICAgIC8vXG4gICAgLy8gY3JlYXRlIHRoZSBjb21wb25lbnQgZHluYW1pY2FsbHkgLSBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2RvY3MvdHMvbGF0ZXN0L2Nvb2tib29rL2R5bmFtaWMtY29tcG9uZW50LWxvYWRlci5odG1sXG4gICAgLy9cbiAgICBpZiAoIWhvc3QpIHJldHVybjtcbiAgICBpZiAoaXNHcmlkKSB7XG4gICAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IGhvdyB0byBjcmVhdGUgbmcgY29tcG9uZW50IGluc2lkZSByZWd1bGFyIERpdi4gbmVlZCB0byBhY2Nlc3MgYXBwIGluamVjdG9ycy4uLlxuICAgICAgLy8gaWYgKCFjb250YWluZXIpIHtcbiAgICAgIC8vICAgY29uc3QgaG9zdEVsZW1lbnQ6IEVsZW1lbnQgPSBob3N0O1xuICAgICAgLy8gICBjb25zdCBlbnZpcm9ubWVudEluamVjdG9yOiBFbnZpcm9ubWVudEluamVjdG9yO1xuICAgICAgLy8gICBncmlkID0gY3JlYXRlQ29tcG9uZW50KEdyaWRzdGFja0NvbXBvbmVudCwge2Vudmlyb25tZW50SW5qZWN0b3IsIGhvc3RFbGVtZW50fSk/Lmluc3RhbmNlO1xuICAgICAgLy8gfVxuXG4gICAgICBjb25zdCBncmlkSXRlbUNvbXAgPSAoaG9zdC5wYXJlbnRFbGVtZW50IGFzIEdyaWRJdGVtQ29tcEhUTUxFbGVtZW50KT8uX2dyaWRJdGVtQ29tcDtcbiAgICAgIGlmICghZ3JpZEl0ZW1Db21wKSByZXR1cm47XG4gICAgICAvLyBjaGVjayBpZiBncmlkSXRlbSBoYXMgYSBjaGlsZCBjb21wb25lbnQgd2l0aCAnY29udGFpbmVyJyBleHBvc2VkIHRvIGNyZWF0ZSB1bmRlci4uXG4gICAgICBjb25zdCBjb250YWluZXIgPSAoZ3JpZEl0ZW1Db21wLmNoaWxkV2lkZ2V0IGFzIGFueSk/LmNvbnRhaW5lciB8fCBncmlkSXRlbUNvbXAuY29udGFpbmVyO1xuICAgICAgY29uc3QgZ3JpZFJlZiA9IGNvbnRhaW5lcj8uY3JlYXRlQ29tcG9uZW50KEdyaWRzdGFja0NvbXBvbmVudCk7XG4gICAgICBjb25zdCBncmlkID0gZ3JpZFJlZj8uaW5zdGFuY2U7XG4gICAgICBpZiAoIWdyaWQpIHJldHVybjtcbiAgICAgIGdyaWQucmVmID0gZ3JpZFJlZjtcbiAgICAgIGdyaWQub3B0aW9ucyA9IG47XG4gICAgICByZXR1cm4gZ3JpZC5lbDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JpZENvbXAgPSAoaG9zdCBhcyBHcmlkQ29tcEhUTUxFbGVtZW50KS5fZ3JpZENvbXA7XG4gICAgICBjb25zdCBncmlkSXRlbVJlZiA9IGdyaWRDb21wPy5jb250YWluZXI/LmNyZWF0ZUNvbXBvbmVudChHcmlkc3RhY2tJdGVtQ29tcG9uZW50KTtcbiAgICAgIGNvbnN0IGdyaWRJdGVtID0gZ3JpZEl0ZW1SZWY/Lmluc3RhbmNlO1xuICAgICAgaWYgKCFncmlkSXRlbSkgcmV0dXJuO1xuICAgICAgZ3JpZEl0ZW0ucmVmID0gZ3JpZEl0ZW1SZWZcblxuICAgICAgLy8gZGVmaW5lIHdoYXQgdHlwZSBvZiBjb21wb25lbnQgdG8gY3JlYXRlIGFzIGNoaWxkLCBPUiB5b3UgY2FuIGRvIGl0IEdyaWRzdGFja0l0ZW1Db21wb25lbnQgdGVtcGxhdGUsIGJ1dCB0aGlzIGlzIG1vcmUgZ2VuZXJpY1xuICAgICAgY29uc3Qgc2VsZWN0b3IgPSBuLnNlbGVjdG9yO1xuICAgICAgY29uc3QgdHlwZSA9IHNlbGVjdG9yID8gR3JpZHN0YWNrQ29tcG9uZW50LnNlbGVjdG9yVG9UeXBlW3NlbGVjdG9yXSA6IHVuZGVmaW5lZDtcbiAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgIC8vIHNoYXJlZCBjb2RlIHRvIGNyZWF0ZSBvdXIgc2VsZWN0b3IgY29tcG9uZW50XG4gICAgICAgIGNvbnN0IGNyZWF0ZUNvbXAgPSAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgY2hpbGRXaWRnZXQgPSBncmlkSXRlbS5jb250YWluZXI/LmNyZWF0ZUNvbXBvbmVudCh0eXBlKT8uaW5zdGFuY2UgYXMgQmFzZVdpZGdldDtcbiAgICAgICAgICAvLyBpZiBwcm9wZXIgQmFzZVdpZGdldCBzdWJjbGFzcywgc2F2ZSBpdCBhbmQgbG9hZCBhZGRpdGlvbmFsIGRhdGFcbiAgICAgICAgICBpZiAoY2hpbGRXaWRnZXQgJiYgdHlwZW9mIGNoaWxkV2lkZ2V0LnNlcmlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgY2hpbGRXaWRnZXQuZGVzZXJpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGdyaWRJdGVtLmNoaWxkV2lkZ2V0ID0gY2hpbGRXaWRnZXQ7XG4gICAgICAgICAgICBjaGlsZFdpZGdldC5kZXNlcmlhbGl6ZShuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXp5TG9hZCA9IG4ubGF6eUxvYWQgfHwgbi5ncmlkPy5vcHRzPy5sYXp5TG9hZCAmJiBuLmxhenlMb2FkICE9PSBmYWxzZTtcbiAgICAgICAgaWYgKGxhenlMb2FkKSB7XG4gICAgICAgICAgaWYgKCFuLnZpc2libGVPYnNlcnZhYmxlKSB7XG4gICAgICAgICAgICBuLnZpc2libGVPYnNlcnZhYmxlID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKChbZW50cnldKSA9PiB7IGlmIChlbnRyeS5pc0ludGVyc2VjdGluZykge1xuICAgICAgICAgICAgICBuLnZpc2libGVPYnNlcnZhYmxlPy5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgIGRlbGV0ZSBuLnZpc2libGVPYnNlcnZhYmxlO1xuICAgICAgICAgICAgICBjcmVhdGVDb21wKCk7XG4gICAgICAgICAgICB9fSk7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBuLnZpc2libGVPYnNlcnZhYmxlPy5vYnNlcnZlKGdyaWRJdGVtLmVsKSk7IC8vIHdhaXQgdW50aWwgY2FsbGVlIHNldHMgcG9zaXRpb24gYXR0cmlidXRlc1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGNyZWF0ZUNvbXAoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGdyaWRJdGVtLmVsO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvL1xuICAgIC8vIFJFTU9WRSAtIGhhdmUgdG8gY2FsbCBDb21wb25lbnRSZWY6ZGVzdHJveSgpIGZvciBkeW5hbWljIG9iamVjdHMgdG8gY29ycmVjdGx5IHJlbW92ZSB0aGVtc2VsdmVzXG4gICAgLy8gTm90ZTogdGhpcyB3aWxsIGRlc3Ryb3kgYWxsIGNoaWxkcmVuIGR5bmFtaWMgY29tcG9uZW50cyBhcyB3ZWxsOiBncmlkSXRlbSAtPiBjaGlsZFdpZGdldFxuICAgIC8vXG4gICAgaWYgKGlzR3JpZCkge1xuICAgICAgY29uc3QgZ3JpZCA9IChuLmVsIGFzIEdyaWRDb21wSFRNTEVsZW1lbnQpPy5fZ3JpZENvbXA7XG4gICAgICBpZiAoZ3JpZD8ucmVmKSBncmlkLnJlZi5kZXN0cm95KCk7XG4gICAgICBlbHNlIGdyaWQ/Lm5nT25EZXN0cm95KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyaWRJdGVtID0gKG4uZWwgYXMgR3JpZEl0ZW1Db21wSFRNTEVsZW1lbnQpPy5fZ3JpZEl0ZW1Db21wO1xuICAgICAgaWYgKGdyaWRJdGVtPy5yZWYpIGdyaWRJdGVtLnJlZi5kZXN0cm95KCk7XG4gICAgICBlbHNlIGdyaWRJdGVtPy5uZ09uRGVzdHJveSgpO1xuICAgIH1cbiAgfVxuICByZXR1cm47XG59XG5cbi8qKlxuICogY2FsbGVkIGZvciBlYWNoIGl0ZW0gaW4gdGhlIGdyaWQgLSBjaGVjayBpZiBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIG5lZWRzIHRvIGJlIHNhdmVkLlxuICogTm90ZTogc2luY2UgdGhpcyBpcyBvcHRpb25zIG1pbnVzIGdyaWRzdGFjayBwcm90ZWN0ZWQgbWVtYmVycyB1c2luZyBVdGlscy5yZW1vdmVJbnRlcm5hbEZvclNhdmUoKSxcbiAqIHRoaXMgdHlwaWNhbGx5IGRvZXNuJ3QgbmVlZCB0byBkbyBhbnl0aGluZy4gSG93ZXZlciB5b3VyIGN1c3RvbSBDb21wb25lbnQgQElucHV0KCkgYXJlIG5vdyBzdXBwb3J0ZWRcbiAqIHVzaW5nIEJhc2VXaWRnZXQuc2VyaWFsaXplKClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdzU2F2ZUFkZGl0aW9uYWxOZ0luZm8objogTmdHcmlkU3RhY2tOb2RlLCB3OiBOZ0dyaWRTdGFja1dpZGdldCkge1xuICBjb25zdCBncmlkSXRlbSA9IChuLmVsIGFzIEdyaWRJdGVtQ29tcEhUTUxFbGVtZW50KT8uX2dyaWRJdGVtQ29tcDtcbiAgaWYgKGdyaWRJdGVtKSB7XG4gICAgY29uc3QgaW5wdXQgPSBncmlkSXRlbS5jaGlsZFdpZGdldD8uc2VyaWFsaXplKCk7XG4gICAgaWYgKGlucHV0KSB7XG4gICAgICB3LmlucHV0ID0gaW5wdXQ7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuICAvLyBlbHNlIGNoZWNrIGlmIEdyaWRcbiAgY29uc3QgZ3JpZCA9IChuLmVsIGFzIEdyaWRDb21wSFRNTEVsZW1lbnQpPy5fZ3JpZENvbXA7XG4gIGlmIChncmlkKSB7XG4gICAgLy8uLi4uIHNhdmUgYW55IGN1c3RvbSBkYXRhXG4gIH1cbn1cblxuLyoqXG4gKiB0cmFjayB3aGVuIHdpZGdldGEgcmUgdXBkYXRlZCAocmF0aGVyIHRoYW4gY3JlYXRlZCkgdG8gbWFrZSBzdXJlIHdlIGRlLXNlcmlhbGl6ZSB0aGVtIGFzIHdlbGxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdzVXBkYXRlTmdDb21wb25lbnRzKG46IE5nR3JpZFN0YWNrTm9kZSkge1xuICBjb25zdCB3OiBOZ0dyaWRTdGFja1dpZGdldCA9IG47XG4gIGNvbnN0IGdyaWRJdGVtID0gKG4uZWwgYXMgR3JpZEl0ZW1Db21wSFRNTEVsZW1lbnQpPy5fZ3JpZEl0ZW1Db21wO1xuICBpZiAoZ3JpZEl0ZW0/LmNoaWxkV2lkZ2V0ICYmIHcuaW5wdXQpIGdyaWRJdGVtLmNoaWxkV2lkZ2V0LmRlc2VyaWFsaXplKHcpO1xufSJdfQ==