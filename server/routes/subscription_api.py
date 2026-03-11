from db import get_session
from fastapi import APIRouter, Depends, HTTPException
from models import Subscription
from sqlmodel import Session, select
from schemas import CreateSubscriptionRequest, UpdateSubscriptionRequest
from services.get_user import get_user

router = APIRouter(prefix='/subscription', tags=['Subscriptions'])

@router.get('/')
def get_subscriptions(session: Session = Depends(get_session), user = Depends(get_user)):
    statement = select(Subscription).where(Subscription.user_id == user.id)
    return session.exec(statement).all()

@router.get('/{subscription_id}')
def get_subscription(subscription_id: int, session: Session = Depends(get_session), user = Depends(get_user)):
    subscription = session.get(Subscription, subscription_id)
    
    if not subscription or str(subscription.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Subscription not found or unauthorized")
        
    return subscription

@router.post('/create')
def create_subscription(request: CreateSubscriptionRequest, session: Session = Depends(get_session), user = Depends(get_user)):
    subscription = Subscription.model_validate(request, update={"user_id": user.id})
    
    session.add(subscription)
    try:
        session.commit()
        session.refresh(subscription)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")
    
    return subscription

@router.post('/update/{subscription_id}')
def update_subscription(subscription_id: int, request: UpdateSubscriptionRequest, session: Session = Depends(get_session), user = Depends(get_user)):
    subscription = session.get(Subscription, subscription_id)
    
    if not subscription or str(subscription.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Subscription not found or unauthorized")
    
    update_data = request.model_dump(exclude_unset=True)
    subscription.sqlmodel_update(update_data)
    
    try:
        session.add(subscription)
        session.commit()
        session.refresh(subscription)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Update failed: {str(e)}")
    
    return subscription

@router.delete('/delete/{subscription_id}')
def delete_subscription(subscription_id: int, session: Session = Depends(get_session), user = Depends(get_user)):
    subscription = session.get(Subscription, subscription_id)
    
    if not subscription or str(subscription.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Subscription not found or unauthorized")
    
    try:
        session.delete(subscription)
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Delete failed: {str(e)}")
        
    return {"message": "Subscription deleted successfully"}