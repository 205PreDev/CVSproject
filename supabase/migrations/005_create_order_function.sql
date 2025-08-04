-- functions.sql

CREATE OR REPLACE FUNCTION create_order(
    p_customer_id UUID,
    p_store_id UUID,
    p_order_items JSONB
) RETURNS JSONB AS $$
DECLARE
    new_order_id UUID;
    order_item JSONB;
    total_price NUMERIC := 0;
    product_info RECORD;
BEGIN
    -- Calculate total price first
    FOR order_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        SELECT price INTO product_info FROM products WHERE id = (order_item->>'product_id')::UUID;
        total_price := total_price + (product_info.price * (order_item->>'quantity')::INT);
    END LOOP;

    -- Insert into orders table
    INSERT INTO orders (customer_id, store_id, total_amount, final_amount, status, order_type)
    VALUES (p_customer_id, p_store_id, total_price, total_price, 'pending', 'pickup')
    RETURNING id INTO new_order_id;

    -- Insert into order_items table
    FOR order_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        SELECT price INTO product_info FROM products WHERE id = (order_item->>'product_id')::UUID;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (new_order_id, (order_item->>'product_id')::UUID, (order_item->>'quantity')::INT, product_info.price, (product_info.price * (order_item->>'quantity')::INT));
    END LOOP;

    RETURN jsonb_build_object('order_id', new_order_id);
END;
$$ LANGUAGE plpgsql;