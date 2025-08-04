// 紧凑界面优化脚本

// 页面加载完成后自动应用紧凑样式
document.addEventListener('DOMContentLoaded', function() {
    // 监听预约模态框的显示
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.id === 'booking-modal' && target.style.display === 'block') {
                    applyCompactStyles();
                }
            }
        });
    });
    
    const bookingModal = document.getElementById('booking-modal');
    if (bookingModal) {
        observer.observe(bookingModal, { attributes: true });
    }
});

// 应用紧凑样式到整个预约系统
function applyCompactStyles() {
    const bookingModal = document.getElementById('booking-modal');
    if (bookingModal) {
        bookingModal.classList.add('compact-booking');
    }
    
    // 优化模态框高度
    const modalContent = bookingModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.maxHeight = '90vh';
        modalContent.style.overflow = 'hidden';
    }
    
    const modalBody = bookingModal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.style.maxHeight = '70vh';
        modalBody.style.overflowY = 'auto';
        modalBody.style.padding = '1rem';
    }
    
    // 监听步骤切换
    const stepObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('booking-step') && target.classList.contains('active')) {
                    optimizeCurrentStep(target);
                }
            }
        });
    });
    
    const bookingSteps = bookingModal.querySelectorAll('.booking-step');
    bookingSteps.forEach(step => {
        stepObserver.observe(step, { attributes: true });
    });
}

// 优化当前激活的步骤
function optimizeCurrentStep(stepElement) {
    const stepId = stepElement.id;
    
    // 通用优化
    optimizeCommonElements(stepElement);
    
    // 特定步骤优化
    switch(stepId) {
        case 'booking-step-1':
            optimizeDateSelection(stepElement);
            break;
        case 'booking-step-2':
            optimizeTicketSelection(stepElement);
            break;
        case 'booking-step-3':
            optimizeUserInfo(stepElement);
            break;
        case 'booking-step-4':
            optimizePayment(stepElement);
            break;
    }
}

// 通用元素优化
function optimizeCommonElements(stepElement) {
    // 优化标题
    const title = stepElement.querySelector('h3');
    if (title) {
        title.style.fontSize = '1.2rem';
        title.style.marginBottom = '0.8rem';
    }
    
    // 优化表单组
    const formGroups = stepElement.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.style.marginBottom = '0.8rem';
        
        const label = group.querySelector('label');
        if (label) {
            label.style.fontSize = '1rem';
            label.style.marginBottom = '0.5rem';
        }
        
        const input = group.querySelector('input, select');
        if (input) {
            input.style.padding = '0.8rem';
            input.style.fontSize = '0.9rem';
        }
    });
    
    // 优化按钮区域
    const formActions = stepElement.querySelector('.form-actions');
    if (formActions) {
        formActions.style.gap = '0.8rem';
        formActions.style.marginTop = '0.8rem';
        
        const buttons = formActions.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.style.padding = '0.8rem 1.5rem';
            btn.style.fontSize = '0.9rem';
        });
    }
}

// 优化日期选择步骤
function optimizeDateSelection(stepElement) {
    const dateInput = stepElement.querySelector('#visit-date');
    if (dateInput) {
        dateInput.style.marginBottom = '1rem';
    }
    
    const timeSlots = stepElement.querySelector('.time-slots');
    if (timeSlots) {
        const title = timeSlots.querySelector('h4');
        if (title) {
            title.style.fontSize = '1.1rem';
            title.style.marginBottom = '0.8rem';
        }
        
        const timeGrid = timeSlots.querySelector('.time-grid');
        if (timeGrid) {
            timeGrid.style.gap = '0.8rem';
            timeGrid.style.marginBottom = '1rem';
        }
        
        const timeSlotButtons = timeSlots.querySelectorAll('.ancient-time-slot');
        timeSlotButtons.forEach(slot => {
            slot.style.padding = '1rem';
            
            const timeText = slot.querySelector('.time-text');
            if (timeText) {
                timeText.style.fontSize = '1rem';
            }
            
            const timeStatus = slot.querySelector('.time-status');
            if (timeStatus) {
                timeStatus.style.fontSize = '0.8rem';
            }
        });
    }
}

// 优化票种选择步骤
function optimizeTicketSelection(stepElement) {
    const ticketTypes = stepElement.querySelector('.ticket-types');
    if (ticketTypes) {
        ticketTypes.style.gap = '0.8rem';
        ticketTypes.style.marginBottom = '1rem';
        
        const ticketTypeItems = ticketTypes.querySelectorAll('.ticket-type');
        ticketTypeItems.forEach(item => {
            item.style.padding = '0.8rem';
            item.style.flexDirection = 'row';
            item.style.alignItems = 'center';
            
            const ticketInfo = item.querySelector('.ticket-info');
            if (ticketInfo) {
                ticketInfo.style.flex = '1';
                
                const title = ticketInfo.querySelector('h4');
                if (title) {
                    title.style.fontSize = '1rem';
                    title.style.marginBottom = '0.2rem';
                }
                
                const desc = ticketInfo.querySelector('p');
                if (desc) {
                    desc.style.fontSize = '0.8rem';
                    desc.style.marginBottom = '0.2rem';
                }
                
                const price = ticketInfo.querySelector('.ticket-price');
                if (price) {
                    price.style.fontSize = '1.1rem';
                }
            }
        });
    }
    
    const totalInfo = stepElement.querySelector('.total-info');
    if (totalInfo) {
        totalInfo.style.padding = '0.8rem';
        totalInfo.style.marginBottom = '0.8rem';
        
        const totalText = totalInfo.querySelector('p');
        if (totalText) {
            totalText.style.fontSize = '1rem';
        }
    }
}

// 优化游客信息步骤
function optimizeUserInfo(stepElement) {
    // 优化重要提醒
    const importantNotice = stepElement.querySelector('.important-notice');
    if (importantNotice) {
        importantNotice.style.padding = '0.8rem';
        importantNotice.style.marginBottom = '0.8rem';
        
        const noticeTitle = importantNotice.querySelector('h4');
        if (noticeTitle) {
            noticeTitle.style.fontSize = '0.9rem';
            noticeTitle.style.marginBottom = '0.4rem';
        }
        
        const noticeItems = importantNotice.querySelectorAll('li');
        noticeItems.forEach(item => {
            item.style.marginBottom = '0.2rem';
            item.style.fontSize = '0.8rem';
            item.style.paddingLeft = '1rem';
        });
    }
    
    // 特别优化表单输入框
    const inputs = stepElement.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        input.style.padding = '0.8rem';
        input.style.fontSize = '0.9rem';
    });
}

// 优化支付步骤
function optimizePayment(stepElement) {
    const orderInfo = stepElement.querySelector('.order-info');
    if (orderInfo) {
        orderInfo.style.padding = '0.8rem';
        orderInfo.style.marginBottom = '0.8rem';
        
        const orderTitle = orderInfo.querySelector('h3');
        if (orderTitle) {
            orderTitle.style.fontSize = '1.1rem';
            orderTitle.style.marginBottom = '0.5rem';
        }
        
        const orderItems = orderInfo.querySelectorAll('.order-item');
        orderItems.forEach(item => {
            item.style.padding = '0.4rem 0';
            item.style.fontSize = '0.9rem';
        });
    }
    
    const paymentCountdown = stepElement.querySelector('.payment-countdown');
    if (paymentCountdown) {
        paymentCountdown.style.padding = '0.6rem';
        paymentCountdown.style.marginBottom = '0.8rem';
        
        const countdownText = paymentCountdown.querySelectorAll('p');
        countdownText.forEach(p => {
            p.style.fontSize = '0.9rem';
        });
    }
    
    const paymentMethods = stepElement.querySelector('.payment-methods');
    if (paymentMethods) {
        const methodTitle = paymentMethods.querySelector('h4');
        if (methodTitle) {
            methodTitle.style.fontSize = '1rem';
            methodTitle.style.marginBottom = '0.5rem';
        }
        
        const paymentOptions = paymentMethods.querySelector('.payment-options');
        if (paymentOptions) {
            paymentOptions.style.gap = '0.5rem';
        }
        
        const paymentButtons = paymentMethods.querySelectorAll('.payment-btn');
        paymentButtons.forEach(btn => {
            btn.style.padding = '0.8rem 0.5rem';
            btn.style.fontSize = '0.8rem';
            
            const icon = btn.querySelector('i');
            if (icon) {
                icon.style.fontSize = '1.5rem';
            }
        });
    }
}

// 重写原有的showStep函数以支持紧凑样式
if (typeof window !== 'undefined') {
    // 保存原始函数
    window.originalShowStep = window.showStep;
    
    // 重写showStep函数
    window.showStep = function(step) {
        // 调用原始函数
        if (window.originalShowStep) {
            window.originalShowStep(step);
        } else {
            // 如果原始函数不存在，执行基本逻辑
            document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
            const stepElement = document.getElementById(`booking-step-${step}`);
            if (stepElement) {
                stepElement.classList.add('active');
            }
            if (typeof currentStep !== 'undefined') {
                currentStep = step;
            }
        }
        
        // 应用紧凑样式
        setTimeout(() => {
            applyCompactStyles();
            const activeStep = document.querySelector('.booking-step.active');
            if (activeStep) {
                optimizeCurrentStep(activeStep);
            }
        }, 100);
    };
}

console.log('紧凑界面优化脚本已加载');