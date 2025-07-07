// SPDX-License-Identifier: MIT
// From https://github.com/TarekRaafat/autoComplete.js/issues/119

export type SelectorFunction = () => HTMLElement;

export type DataSourceFunction = (query: string) => DataSourceItem[] | Promise<DataSourceItem[]>;
export type DataFilterFunction = (items: DataSourceItem[]) => DataSourceItem[];
export type TriggerFunction = (event: Event, query: string) => boolean;
export type QueryFunction = (query: string) => string;
export type SearchEngineFunction = (query: string, record: DataSourceItem) => string;
export type ItemElementManipulationFunction = (item: HTMLElement, data: ItemResultData) => void;
export type ListElementManipulationFunction = (list: HTMLElement, data: ListResultData) => void;

export type DataSourceObject = Record<string, unknown>;
export type DataSourceItem = string | DataSourceObject;
export type DataSource = DataSourceFunction | DataSourceItem[];

export type SearchEngineType = "loose" | "strict";
export type CustomInputEvents =
    | "init"
    | "response"
    | "results"
    | "open"
    | "navigate"
    | "selection"
    | "close"
    | "clear";

export interface ItemResultData {
    match: DataSourceItem;
    value: DataSourceItem;
    key?: string;
}

export interface SearchEngineOptions {
    /**
     * Enable to normalize query and data values using String.normalize and by removing u0300 through u036f.
     * See [String.normalize](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize).
     * @default false
     */
    diacritics?: boolean;
    /**
     * Enable to highlight matching characters using HTMLMarkElement, or a string of CSS classes to add to any
     * generated mark elements.
     * @default false
     */
    highlight?: boolean | string;
    /**
     * "strict" checks if the given query is contained within the data, "loose" returns every
     * result where every character in the query is present in the data in any order and location.
     * Given the manipulated query input and each data.src array entry or for each entry[config.data.keys].
     * @default "strict"
     */
    mode?: SearchEngineType;
}

export interface ListResultData {
    query: string;
    matches: DataSourceItem[];
    results: DataSourceItem[];
}

export interface Data {
    /**
     * If true, autoComplete.js fetches all {@link src} when initialized and never again.
     * @default false
     */
    cache?: boolean;

    /**
     * Only used if {@link src} is an array of objects. Specifies which keys in the objects
     * autoComplete.js should search.
     */
    keys?: string[];

    /**
     * Used to filter and sort matching returns from {@link src}
     * before showing them to the user. Is given
     * all the results from {@link src} that matches the query.
     * @param items - Array of items to filter.
     * @returns Array of filtered items.
     */
    filter?: DataFilterFunction;

    /**
     * Values to search or an async or immediate function that returns an array of values to search.
     */
    src?: DataSource;
}

export interface ResultItem {
    /**
     * HTML tag to use for rendering each result.
     * @default "li"
     */
    tag?: string;

    /**
     * Prefix to use for the ID of each result element. _ and a number from 0 to maxResults is appended, so the
     * final ID is for example `autoComplete_result_0` or `autoComplete_result_10`.
     * @default "autoComplete_result"
     */
    id?: string;

    /**
     * Class names to give to each result element.
     */
    class?: string;

    /**
     * Invoked before showing the results list. Allows manipulation of the DOM before it is added to the document.
     */
    element?: ItemElementManipulationFunction;

    /**
     * Enable to highlight matching characters using HTMLMarkElement, or a string of CSS classes to add to any
     * generated mark elements.
     * @default false
     */
    highlight?: boolean | string;

    /**
     * CSS classes to add and remove from result items the user navigates to using the keyboard.
     */
    selected?: string;

    /**
     * If enabled pressing enter will not prevent default behavior
     * @default false
     */
    submit?: boolean;
}

export interface ResultsList {
    /**
     * HTML tag to use for rendering the result container.
     * @default "ul"
     */
    tag?: string;

    /**
     * ID given to the result container.
     * @default "autoComplete_list_index"
     */
    id?: string;

    /**
     * Class names to give to the result container.
     */
    class?: string;

    /**
     * Selector that points to where you want to insert the result elements. Defaults to {@link AutocompleteConfig.selector}.
     */
    destination?: string | SelectorFunction;

    /**
     * Position relative to config.selector where to insert the results list. See
     * [insertAdjacentElement](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement#parameters].
     * @default "afterend"
     */
    position?: InsertPosition;

    /**
     * Invoked before showing the results list. Allows manipulation of the DOM before it is added to the document.
     */
    element?: ListElementManipulationFunction;

    /**
     * Maximum number of results to render.
     * @default 5
     */
    maxResults?: number;

    /**
     * Makes the Tab key select the entry navigated to using the keyboard, just like Enter.
     * @default false
     */
    tabSelection?: boolean;

    /**
     * If enabled the results list will render when there are zero matches. For example if you want
     * to show a custom message or help to the user in {@link element}.
     * @default false
     */
    noResults?: boolean;
}

export interface Events {
    /**
     * Maps event names to event handlers for the input element. Each key must be a valid event name,
     * and each value must be an event handler function. Default handlers are keydown and blur.
     */
    input?: { [P in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[P]) => unknown } & Record<
        CustomInputEvents,
        (event: Event) => unknown
    >;
    /**
     * Same as {@link input}, but for the result list container element. Default handlers are mousedown and click.
     */
    list?: { [P in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[P]) => unknown };
}

export interface AutocompleteConfig {
    /**
     * Auto assigned instance unique identifier.
     */
    id?: number | string;

    /**
     * Prepended to all created DOM element class names.
     * @default "autoComplete"
     */
    name?: string;

    /**
     * Must point to or return the relevant input field or element that autoComplete.js should act upon.
     * @default "#autoComplete"
     */
    selector?: string | SelectorFunction;

    /**
     * Data source.
     */
    data?: Data;

    /**
     * Return true if you want autoComplete.js to start. Default trigger function returns true if input field
     * is _NOT_ empty _and_ greater than or equal to {@link threshold}.
     */
    trigger?: TriggerFunction;

    /**
     * For manipulating the input value before running the search, for example if you want to remove spaces or
     * anything else. Is given the raw input value.
     */
    query?: QueryFunction;

    /**
     * Placeholder to set on the input element. For example `Search...`.
     */
    placeHolder?: string;

    /**
     * Minimum number of characters required in the input before triggering autocompletion.
     * @default 1
     */
    threshold?: number;

    /**
     * Delay in milliseconds after input for autocompletion to start.
     * @default 0
     */
    debounce?: number;

    /**
     * Wraps the input element in a div for a11y purposes, adding some ARIA attributes.
     */
    wrapper?: boolean;

    /**
     * "strict" checks if the given query is contained within the data, "loose" returns every
     * result where every character in the query is present in the data in any order and location.
     * Given the manipulated query input and each data.src array entry or for each entry[config.data.keys].
     * @default "strict"
     */
    searchEngine?: SearchEngineType | SearchEngineFunction;

    /**
     * Enable to normalize query and data values using String.normalize and by removing u0300 through u036f.
     * See [String.normalize](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize).
     * @default false
     */
    diacritics?: boolean;

    /**
     * Responsible for the results list element rendering, interception, and customizing.
     * false to disable result list rendering
     */
    resultsList?: boolean | ResultsList;

    /**
     * Customize each rendered autocompletion result.
     */
    resultItem?: ResultItem;

    /**
     * Allows adding custom or overriding internal event handling.
     */
    events?: Events;
}

export default class autoComplete {
    constructor(config: AutocompleteConfig);

    /**
     * Runs init() core function which is responsible for the following tasks in order:
     *
     * 1. Setting input field attributes & placeholder text (if set)
     * 2. Creating wrapper element and moving the selected input inside it
     * 3. Creating new empty hidden list
     * 4. Getting data if set to cache
     * 5. Attaching all event listeners on the events list
     * 6. Emitting init event
     */
    init(): void;

    /**
     * Runs start(query) core function which is responsible for the following tasks in order:
     *
     * 1. Getting the input query value if NOT passed as an argument
     * 2. Manipulating query value
     * 3. Checking trigger condition validity to proceed
     * 4. Fetching data from src or store if cached
     * 5. Start matching results
     * 6. Rendering list if enabled
     * @param query The query to search for. Defaults to the value of the input field.
     */
    start(query?: string): void;

    /**
     * Runs the autoComplete.js powerful search engine.
     * Find matching characters in record.
     * @param query Search query value
     * @param record Data record string
     * @param options Search Engine configuration options
     * @returns Matching data record
     */
    search(query: string, record: string, options?: SearchEngineOptions): string;

    /**
     * Opens resultsList if not empty
     */
    open(): void;

    /**
     * Navigates to the next resultItem on the list
     */
    next(): void;

    /**
     * Navigates to the previous resultItem on the list
     */
    previous(): void;

    /**
     * Navigates to a specific resultItem on the list by its index number
     * @param index The index of the result item to navigate to.
     */
    goTo(index: number): void;

    /**
     * Selects a resultItem from the list by its index number
     * @param index The index of the result item to select. Defaults to the current cursor position.
     */
    select(index?: number): void;

    /**
     * Closes the resultsList if opened
     */
    close(): void;

    /**
     * Removes all the event listeners on the events list.
     */
    uninit(): void;
}
