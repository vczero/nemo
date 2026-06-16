package com.ywllab.nemo.util

import org.junit.Assert
import org.junit.Test

class CryptoUtilTest {

    @Test
    fun decrypt() {
        val cipher = "iDoUGMOINFboYnHWnSg/JaiBTEYPFAl9KZ0rudIwLzw="
        Assert.assertEquals("mryund@gmail.com!1A", CryptoUtil.decrypt(cipher))
    }

    @Test
    fun encrypt() {
        val cipher = "123456"
        Assert.assertEquals("0Q6CxdrLRAhmte8Ly52cAg==", CryptoUtil.encrypt(cipher))
    }
}
