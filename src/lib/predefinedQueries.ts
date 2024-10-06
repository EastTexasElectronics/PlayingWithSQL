export const predefinedQueries = [
  {
    name: "All Users",
    query: `
  SELECT *
  FROM Users
      `.trim(),
  },
  {
    name: "All Products",
    query: `
  SELECT *
  FROM Products
      `.trim(),
  },
  {
    name: "User Count",
    query: `
  SELECT COUNT(*) AS total_users
  FROM Users
      `.trim(),
  },
  {
    name: "Top 5 Expensive Products",
    query: `
  SELECT name, price
  FROM Products
  ORDER BY price DESC
  LIMIT 5
      `.trim(),
  },
  {
    name: "Recent Orders",
    query: `
  SELECT o.order_id, u.username, o.order_date, o.total_amount
  FROM Orders o
  JOIN Users u ON o.user_id = u.id
  ORDER BY o.order_date DESC
      `.trim(),
  },
  {
    name: "Product Categories with Products",
    query: `
  SELECT
    c.name AS category_name,
    COUNT(DISTINCT p.product_id) AS product_count,
    STRING_AGG(DISTINCT p.name, ', ') AS products
  FROM Categories c
  LEFT JOIN Products p ON c.category_id = p.category_id
  GROUP BY c.name
  ORDER BY product_count DESC, c.name
      `.trim(),
  },
  {
    name: "Users with Most Orders",
    query: `
  SELECT u.username, COUNT(o.order_id) AS order_count
  FROM Users u
  LEFT JOIN Orders o ON u.id = o.user_id
  GROUP BY u.id, u.username
  ORDER BY order_count DESC
  LIMIT 5
      `.trim(),
  },
  {
    name: "Average Order Value",
    query: `
  SELECT AVG(total_amount) AS avg_order_value
  FROM Orders
      `.trim(),
  },
  {
    name: "Products with Low Inventory",
    query: `
  SELECT p.name, i.quantity
  FROM Products p
  JOIN Inventory i ON p.product_id = i.product_id
  WHERE i.quantity < 10
  ORDER BY i.quantity ASC
      `.trim(),
  },
  {
    name: "Top Rated Products",
    query: `
  SELECT p.name, COALESCE(AVG(r.rating), 0) AS avg_rating, COUNT(r.review_id) AS review_count
  FROM Products p
  LEFT JOIN Reviews r ON p.product_id = r.product_id
  GROUP BY p.product_id, p.name
  HAVING COUNT(r.review_id) > 5
  ORDER BY avg_rating DESC
  LIMIT 10
      `.trim(),
  },
  {
    name: "Monthly Sales",
    query: `
  SELECT DATE_TRUNC('month', order_date) AS month, SUM(total_amount) AS total_sales
  FROM Orders
  GROUP BY DATE_TRUNC('month', order_date)
  ORDER BY month DESC
  LIMIT 12
      `.trim(),
  },
  {
    name: "Users with Abandoned Carts",
    query: `
  SELECT u.username, COUNT(c.cart_id) AS items_in_cart
  FROM Users u
  JOIN Carts c ON u.id = c.user_id
  LEFT JOIN Orders o ON u.id = o.user_id
  WHERE o.order_id IS NULL
  GROUP BY u.id, u.username
  HAVING COUNT(c.cart_id) > 0
  ORDER BY items_in_cart DESC
      `.trim(),
  },
  {
    name: "Product Sales Ranking",
    query: `
  SELECT p.name, SUM(oi.quantity) AS total_sold
  FROM Products p
  JOIN OrderItems oi ON p.product_id = oi.product_id
  GROUP BY p.product_id, p.name
  ORDER BY total_sold DESC
  LIMIT 10
      `.trim(),
  },
  {
    name: "Users with Highest Total Spend",
    query: `
  SELECT u.username, SUM(o.total_amount) AS total_spend
  FROM Users u
  JOIN Orders o ON u.id = o.user_id
  GROUP BY u.id, u.username
  ORDER BY total_spend DESC
      `.trim(),
  },
  {
    name: "Products Never Ordered",
    query: `
  SELECT DISTINCT p.name
  FROM Products p
  LEFT JOIN OrderItems oi ON p.product_id = oi.product_id
  WHERE oi.order_item_id IS NULL
      `.trim(),
  },
  {
    name: "Category Sales Performance",
    query: `
  SELECT c.name AS category, SUM(oi.quantity * oi.price) AS total_sales
  FROM Categories c
  JOIN Products p ON c.category_id = p.category_id
  JOIN OrderItems oi ON p.product_id = oi.product_id
  GROUP BY c.category_id, c.name
  ORDER BY total_sales DESC
      `.trim(),
  },
  {
    name: "User Registration Trend",
    query: `
  SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS new_users
  FROM Users
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY month DESC
  LIMIT 12
      `.trim(),
  },
  {
    name: "Orders with Payment Issues",
    query: `
  SELECT o.order_id, u.username, o.total_amount, p.payment_status
  FROM Orders o
  JOIN Users u ON o.user_id = u.id
  JOIN Payments p ON o.order_id = p.order_id
  WHERE p.payment_status != 'Completed'
  ORDER BY o.order_date DESC
      `.trim(),
  },
  {
    name: "Customer Lifetime Value",
    query: `
  WITH customer_orders AS (
    SELECT user_id, SUM(total_amount) AS total_spend,
           MIN(order_date) AS first_order_date,
           MAX(order_date) AS last_order_date,
           COUNT(*) AS order_count
    FROM Orders
    GROUP BY user_id
  )
  SELECT u.username,
         co.total_spend,
         co.order_count,
         co.total_spend / NULLIF(EXTRACT(YEAR FROM AGE(co.last_order_date, co.first_order_date)), 0) AS yearly_value
  FROM Users u
  JOIN customer_orders co ON u.id = co.user_id
  ORDER BY yearly_value DESC
      `.trim(),
  },
  {
    name: "Product Performance Analysis",
    query: `
WITH product_stats AS (
  SELECT
    p.product_id,
    p.name,
    p.price,
    c.name AS category,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.quantity * oi.price) AS total_revenue,
    AVG(r.rating) AS avg_rating,
    COUNT(r.review_id) AS review_count,
    i.quantity AS current_inventory
  FROM Products p
  JOIN Categories c ON p.category_id = c.category_id
  LEFT JOIN OrderItems oi ON p.product_id = oi.product_id
  LEFT JOIN Orders o ON oi.order_id = o.order_id
  LEFT JOIN Reviews r ON p.product_id = r.product_id
  LEFT JOIN Inventory i ON p.product_id = i.product_id
  GROUP BY p.product_id, p.name, p.price, c.name, i.quantity
)
SELECT
  product_id,
  name,
  category,
  price,
  total_orders,
  total_quantity_sold,
  total_revenue,
  ROUND(avg_rating, 2) AS avg_rating,
  review_count,
  current_inventory,
  CASE
    WHEN current_inventory = 0 THEN 'Out of Stock'
    WHEN current_inventory < 10 THEN 'Low Stock'
    WHEN current_inventory < 50 THEN 'Medium Stock'
    ELSE 'High Stock'
  END AS inventory_status,
  ROUND(total_revenue / NULLIF(total_quantity_sold, 0), 2) AS avg_selling_price,
  ROUND((total_revenue - (price * total_quantity_sold)) / NULLIF(total_revenue, 0) * 100, 2) AS profit_margin_percentage
FROM product_stats
ORDER BY total_revenue DESC, avg_rating DESC
LIMIT 20;
  `.trim(),
  },
  {
    name: "Customer Segmentation and Cohort Analysis",
    query: `
WITH customer_cohorts AS (
  SELECT
    u.id AS user_id,
    u.username,
    DATE_TRUNC('month', u.created_at) AS cohort_month,
    DATE_TRUNC('month', o.order_date) AS order_month,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_spent
  FROM Users u
  LEFT JOIN Orders o ON u.id = o.user_id
  GROUP BY u.id, u.username, DATE_TRUNC('month', u.created_at), DATE_TRUNC('month', o.order_date)
),
cohort_size AS (
  SELECT cohort_month, COUNT(DISTINCT user_id) AS cohort_size
  FROM customer_cohorts
  GROUP BY cohort_month
),
user_activity AS (
  SELECT
    user_id,
    username,
    cohort_month,
    order_month,
    total_orders,
    total_spent,
    COALESCE(
      CAST(
        (EXTRACT(YEAR FROM order_month) - EXTRACT(YEAR FROM cohort_month)) * 12 +
        (EXTRACT(MONTH FROM order_month) - EXTRACT(MONTH FROM cohort_month))
      AS INTEGER),
      0
    ) AS months_since_signup
  FROM customer_cohorts
)
SELECT
  ua.cohort_month,
  cs.cohort_size,
  ua.months_since_signup,
  COUNT(DISTINCT ua.user_id) AS active_users,
  ROUND(COUNT(DISTINCT ua.user_id)::NUMERIC / cs.cohort_size * 100, 2) AS retention_rate,
  ROUND(AVG(ua.total_orders), 2) AS avg_orders_per_user,
  ROUND(AVG(ua.total_spent), 2) AS avg_spent_per_user
FROM user_activity ua
JOIN cohort_size cs ON ua.cohort_month = cs.cohort_month
GROUP BY ua.cohort_month, cs.cohort_size, ua.months_since_signup
ORDER BY ua.cohort_month, ua.months_since_signup;
  `.trim(),
  },
  {
    name: "Sales Funnel Analysis",
    query: `
WITH funnel_stages AS (
  SELECT
    COUNT(DISTINCT u.id) AS total_users,
    COUNT(DISTINCT c.user_id) AS users_with_cart,
    COUNT(DISTINCT o.user_id) AS users_with_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'Delivered' THEN o.user_id END) AS users_with_completed_orders,
    COUNT(DISTINCT r.user_id) AS users_with_reviews
  FROM Users u
  LEFT JOIN Carts c ON u.id = c.user_id
  LEFT JOIN Orders o ON u.id = o.user_id
  LEFT JOIN Reviews r ON u.id = r.user_id
),
conversion_rates AS (
  SELECT
    total_users,
    users_with_cart,
    users_with_orders,
    users_with_completed_orders,
    users_with_reviews,
    ROUND(users_with_cart::NUMERIC / NULLIF(total_users, 0) * 100, 2) AS cart_conversion_rate,
    ROUND(users_with_orders::NUMERIC / NULLIF(users_with_cart, 0) * 100, 2) AS order_conversion_rate,
    ROUND(users_with_completed_orders::NUMERIC / NULLIF(users_with_orders, 0) * 100, 2) AS completion_rate,
    ROUND(users_with_reviews::NUMERIC / NULLIF(users_with_completed_orders, 0) * 100, 2) AS review_rate
  FROM funnel_stages
)
SELECT * FROM (
  SELECT 1 AS stage_order, 'Total Users' AS stage, total_users::INTEGER AS count, 100.00 AS conversion_rate
  FROM conversion_rates
  UNION ALL
  SELECT 2, 'Users with Cart', users_with_cart::INTEGER, cart_conversion_rate
  FROM conversion_rates
  UNION ALL
  SELECT 3, 'Users with Orders', users_with_orders::INTEGER, order_conversion_rate
  FROM conversion_rates
  UNION ALL
  SELECT 4, 'Users with Completed Orders', users_with_completed_orders::INTEGER, completion_rate
  FROM conversion_rates
  UNION ALL
  SELECT 5, 'Users with Reviews', users_with_reviews::INTEGER, review_rate
  FROM conversion_rates
) subquery
ORDER BY stage_order;
  `.trim(),
  },
  {
    name: "Time-based Product Performance",
    query: `
WITH monthly_sales AS (
  SELECT
    p.product_id,
    p.name AS product_name,
    c.name AS category_name,
    DATE_TRUNC('month', o.order_date) AS sale_month,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.quantity * oi.price) AS total_revenue
  FROM Products p
  JOIN Categories c ON p.category_id = c.category_id
  JOIN OrderItems oi ON p.product_id = oi.product_id
  JOIN Orders o ON oi.order_id = o.order_id
  WHERE o.status != 'Cancelled'
  GROUP BY p.product_id, p.name, c.name, DATE_TRUNC('month', o.order_date)
),
product_trends AS (
  SELECT
    product_id,
    product_name,
    category_name,
    sale_month,
    total_quantity,
    total_revenue,
    AVG(total_quantity) OVER (PARTITION BY product_id ORDER BY sale_month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg_quantity,
    AVG(total_revenue) OVER (PARTITION BY product_id ORDER BY sale_month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg_revenue,
    LAG(total_quantity) OVER (PARTITION BY product_id ORDER BY sale_month) AS prev_month_quantity,
    LAG(total_revenue) OVER (PARTITION BY product_id ORDER BY sale_month) AS prev_month_revenue
  FROM monthly_sales
)
SELECT
  product_id,
  product_name,
  category_name,
  sale_month,
  total_quantity,
  total_revenue,
  ROUND(moving_avg_quantity, 2) AS moving_avg_quantity,
  ROUND(moving_avg_revenue, 2) AS moving_avg_revenue,
  ROUND((total_quantity - prev_month_quantity)::NUMERIC / NULLIF(prev_month_quantity, 0) * 100, 2) AS quantity_growth_rate,
  ROUND((total_revenue - prev_month_revenue)::NUMERIC / NULLIF(prev_month_revenue, 0) * 100, 2) AS revenue_growth_rate
FROM product_trends
WHERE sale_month >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY product_id, sale_month;
  `.trim(),
  },
];
