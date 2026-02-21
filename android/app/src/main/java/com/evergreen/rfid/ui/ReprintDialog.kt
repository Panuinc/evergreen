package com.evergreen.rfid.ui

import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.DialogFragment
import com.evergreen.rfid.R
import com.evergreen.rfid.api.ApiClient
import com.evergreen.rfid.model.Item

class ReprintDialog : DialogFragment() {

    companion object {
        fun newInstance(item: Item): ReprintDialog {
            return ReprintDialog().apply {
                arguments = Bundle().apply {
                    putString("number", item.number)
                    putString("name", item.displayName)
                    putInt("rfidCode", item.rfidCode ?: 0)
                }
            }
        }
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val ctx = requireContext()
        val view = LayoutInflater.from(ctx).inflate(R.layout.dialog_reprint, null)
        val itemNumber = arguments?.getString("number") ?: ""
        val itemName = arguments?.getString("name") ?: ""
        val rfidCode = arguments?.getInt("rfidCode") ?: 0

        view.findViewById<TextView>(R.id.tvReprintItem).text = "$itemNumber\n$itemName"
        val etQty = view.findViewById<EditText>(R.id.etReprintQty)
        etQty.setText("1")

        val cbEncodeRfid = view.findViewById<android.widget.CheckBox>(R.id.cbEncodeRfid)

        return AlertDialog.Builder(ctx)
            .setTitle(R.string.reprint_title)
            .setView(view)
            .setPositiveButton(R.string.reprint_print) { _, _ ->
                val qty = etQty.text.toString().toIntOrNull() ?: 1
                val encodeRfid = cbEncodeRfid.isChecked

                val apiClient = ApiClient(ctx)
                apiClient.printLabel(itemNumber, qty, encodeRfid, rfidCode) { result ->
                    activity?.runOnUiThread {
                        result.fold(
                            onSuccess = {
                                Toast.makeText(ctx, getString(R.string.reprint_sent), Toast.LENGTH_SHORT).show()
                            },
                            onFailure = { e ->
                                Toast.makeText(ctx, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        )
                    }
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .create()
    }
}
