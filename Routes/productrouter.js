import express, { Router } from 'express'
import upload from '../middleware/multer.js'
import { CreateProduct, DeleteProduct, GetOne, GetProductCategory, ReadProduct, UpdateProduct } from '../Controller/CRUDProduct/crudproduct.js'
import { CreateCategory, DeleteCategory, GetCollection, GetCollectionData, GetOneCategory, ReadCategory, UpdateCategory } from '../Controller/Category/categorycontroll.js'
import { CreateShop, DeleteShop, GetOneShop, ReadShop, UpdateShop } from '../Controller/ShopControll/shopuser.js'
import {ReadCustomers, SendOTP, VerifyOTP } from '../Controller/CustomersControll/CustomerControll.js'
import { ChangePaymentStatus, changestatus, CheckoutOrder, GetPayment, PaymentSuccess, RazorpayPayment, ReadOrder, ReadOrderOnOrder, TransactionStatus, updateKitchenStatus, updateOrderStatus, VerifyPayment} from '../Controller/CheckoutProcess/CheckoutControll.js'
import { CheckManager } from '../Controller/Manager/managercontroll.js'
import { createUser, deleteUser, getUserById, getuserbyrole, getuserbyroleshopid, getUsers, getUsersbyId, updateUser } from '../Controller/AdminUser/AdminUser.js'
import { GetCounts } from '../Controller/GetAllDataControll/GetAllDataControll.js'

const router = express.Router()
// Product Router
router.post('/create/:shopId',upload.single('image'),CreateProduct)
router.get('/getone/:id',GetOne)
router.put('/updateproduct/:id',upload.single('image'),UpdateProduct)
router.delete('/deleteproduct/:id',DeleteProduct)
router.get('/readproduct',ReadProduct)
router.get('/all-products',GetProductCategory)
// Product Router


router.post('/categories',CreateCategory)
router.get('/categories',ReadCategory)
router.get('/getone/:id',GetOneCategory)
router.put('/update/:id',UpdateCategory)
router.delete('/delete/:id',DeleteCategory)
router.get('/mycoll',GetCollection)
router.get('/all-collections',GetCollectionData)

router.post('/addshop',upload.single('image'),CreateShop)
router.get('/addshop',ReadShop)
router.get('/shop/getone/:id',GetOneShop)
router.put('/shop/update/:id',upload.single('image'),UpdateShop)
router.delete('/shop/delete/:id',DeleteShop)


router.post('/user/sendotp', SendOTP);
// router.post('/check-user',CheckUser)
router.post('/verify-otp',VerifyOTP)
// router.post('/save-user-number',SaveUser)
router.get('/readshopcustomer',ReadCustomers)



// Checout Routes 
router.post('/order/createorder',CheckoutOrder)
router.get('/order/readorder',ReadOrder)
router.put('/order/:orderId',TransactionStatus)
 // Get all orders
router.put('/:orderId/status', updateOrderStatus); // Update order status
router.post('/update-status', updateKitchenStatus); // Update kitchen status
router.get('/order/:orderId/status',changestatus)
router.get('/order/readorder/:shopId',ReadOrderOnOrder)



// manager 

  // Create a new shop user
  router.post('/createshopuser', createUser);
  
  // Get all shop users
  router.get('/readshopuser', getUsers);
  
  // Get all shop users by id
  router.get('/readshopuser/:shopId', getUsersbyId);
  
  // Get a shop user by ID
  router.get('/shopuser/getone/:id', getUserById);
  
  // Update a shop user by ID
  router.put('/shopuser/update/:id', updateUser);
  
  router.delete('/shopuser/delete/:id', deleteUser);

router.post('/auth/login',getuserbyrole)
router.get('/order/readorder/:shopId',getuserbyroleshopid)



  // Delete a shop user by ID
  
router.get('/shop/check/:selectedShopId',CheckManager)






router.post('/payment/orders',RazorpayPayment)
router.put('/order/updateorder/:orderId',ChangePaymentStatus)
router.post('/payment/success',PaymentSuccess)
router.post('/payment/verify',VerifyPayment)

// get total payemnt 
router.get('/totalpayment',GetPayment)


// get all data 
router.get('/shop/:shopId/counts',GetCounts)







export default router