import { combineReducers, configureStore } from '@reduxjs/toolkit';
import accountReducer from '../redux/account/accountSlice';
import listBoxReducer from './listForum/lisForumSlice';
import searchQueryReducer from './search/searchSlice';
import filterReducer from './filter/filterSlice';
import planMapReducer from './planMap/planMapSlice';
import listMarkerReducer from './listMarker/listMarkerSllice';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import listGroupReducer from './getId/getIDSlice';
import setPolygonsReducer from './polygonSlice/polygonSlice';
import filterSliceTable from './filterSliceTable/filterSliceTable';
// import baseApi from './apis/baseApi';

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
};

const rootReducer = combineReducers({
    // [baseApi.reducerPath]: baseApi.reducer,
    account: accountReducer,
    listbox: listBoxReducer,
    getid: listGroupReducer,
    searchQuery: searchQueryReducer,
    filter: filterReducer,
    map: planMapReducer,
    listMarker: listMarkerReducer,
    polygonsStore: setPolygonsReducer,
    filterSliceTable: filterSliceTable.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

const persistor = persistStore(store);

export { store, persistor };
