import { useDispatch, useSelector } from 'react-redux';
import { setIsOpenTablePlan } from '../redux/planTableExtend/planTableExtend';
import { useEffect } from 'react';

const useTableListOpen = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state) => state.planTableExtend.isOpen);

    const handleCloseTableList = () => {
        dispatch(setIsOpenTablePlan(false));
    };
    const handleOpenTableList = () => {
        dispatch(setIsOpenTablePlan(true));
    };

    useEffect(() => {
        console.log(isOpen, 'isOpen');
        if (isOpen) {
            window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: 'smooth' });
            console.log(window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }), 'scroll');
        } else {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
    }, [isOpen]);

    return { isOpen, handleCloseTableList, handleOpenTableList };
};

export default useTableListOpen;
