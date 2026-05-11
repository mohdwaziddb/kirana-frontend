import { View, Text } from "react-native";

export default function ResultList({ items }) {

  if (!items || items.length === 0) return null;

  return (
    <View style={{ marginTop: 20, padding: 10 }}>

      <Text style={{
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10
      }}>
        Result
      </Text>

      {items.map((item, index) => (
        <View key={index} style={{
          backgroundColor: "white",
          padding: 15,
          borderRadius: 10,
          marginBottom: 10,
          elevation: 2
        }}>

          <Text style={{ fontWeight: "bold", fontSize: 16 }}>
            {item.name}
          </Text>

          <Text>Qty: {item.quantity}</Text>
          <Text>Price: ₹{item.price || "-"}</Text>
          <Text>Total: ₹{item.total || "-"}</Text>

          <Text style={{
            color: item.matched ? "green" : "red",
            marginTop: 5
          }}>
            {item.matched ? "Matched ✅" : "Not Found ❌"}
          </Text>

        </View>
      ))}

    </View>
  );
}