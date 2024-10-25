import { Modal } from 'antd';
import { memo, useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import PlanMapSection from '../../PlanMapSection';
import './ModalDownMenu.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import Search from 'antd/es/input/Search';
import { useDebounce } from 'use-debounce';
import removeAccents from 'remove-accents';
import TreeDirectory from '../../TreeDirectory';

const ModalDownMenu = ({ handleClose, show }) => {
    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
    });
    const draggleRef = useRef(null);

    const onStart = (_event, uiData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };

    // useEffect(() => {
    //     const searchParams = new URLSearchParams(location.search);
    //     const quyhoachParam = searchParams.get('quyhoach');
    //     if (quyhoachParam) {
    //         setSelectedIDQuyHoach(quyhoachParam.split(',').map(Number));
    //     }
    // }, [location.search]);

    // useEffect(() => {
    //     const searchParams = new URLSearchParams(location.search);
    //     if (selectedIDQuyHoach.length > 0) {
    //         searchParams.set('quyhoach', selectedIDQuyHoach.join(','));
    //     } else {
    //         searchParams.delete('quyhoach');
    //     }

    //     // Giữ nguyên các tham số khác
    //     navigate({ search: searchParams.toString() });
    // }, [selectedIDQuyHoach, location.search, navigate]);

    // useEffect(() => {
    //     const handleGetData = async () => {
    //         if (debouncedInputSearch) {
    //             setIsLoading(true);
    //             const result = listQuyHoach.filter((item) =>
    //                 removeAccents(item.description.toLowerCase()).includes(removeAccents(debouncedInputSearch.toLowerCase()))
    //             );
    //             setSearchResult(result);
    //             setIsLoading(false);
    //         } else {
    //             setSearchResult(listQuyHoach);
    //         }
    //     };
    //     handleGetData();
    // }, [debouncedInputSearch, listQuyHoach]);

    // const handleChangeIDQuyHoach = (id) => {
    //     if (selectedIDQuyHoach.includes(id)) {
    //         setSelectedIDQuyHoach(selectedIDQuyHoach.filter((item) => item !== id));
    //     } else {
    //         setSelectedIDQuyHoach([...selectedIDQuyHoach, id]);
    //     }
    // };

    return (
        <Modal
            key={1212}
            open={show}
            onCancel={handleClose}
            footer={null}
            mask={false}
            modalRender={(modal) => (
                <Draggable
                    disabled={disabled}
                    bounds={bounds}
                    nodeRef={draggleRef}
                    onStart={(event, uiData) => onStart(event, uiData)}
                >
                    <div ref={draggleRef}>{modal}</div>
                </Draggable>
            )}
            title={
                <div
                    style={{
                        width: '100%',
                        cursor: 'move',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '24px',
                    }}
                    onMouseOver={() => {
                        if (disabled) {
                            setDisabled(false);
                        }
                    }}
                    onMouseOut={() => {
                        setDisabled(true);
                    }}
                    onFocus={() => {}}
                    onBlur={() => {}}
                >
                    Danh Sách Quy Hoạch
                </div>
            }
        >
            <div className="menu__container">
                {/* <Search
                    placeholder="Tìm quy hoạch"
                    loading={isLoading}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                /> */}
                {/* {searchResult &&
                    searchResult.length > 0 &&
                    searchResult.map((item) => (
                        <PlanMapSection
                            key={item.id}
                            quyhoach={item}
                            checked={selectedIDQuyHoach.includes(item.id)}
                            onChange={() => handleChangeIDQuyHoach(item.id)}
                        />
                    ))} */}
                <TreeDirectory />
            </div>
        </Modal>
    );
};

export default memo(ModalDownMenu);
